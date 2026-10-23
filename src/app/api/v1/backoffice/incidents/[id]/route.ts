// PATCH /api/v1/backoffice/incidents/{id} — transitions de statut côté back-office
// Système : toutes transitions. Police : transmission autorités + référence de plainte.
import { db } from "@/lib/db";
import { ok, apiFail, parseBody, logAudit, boSpacesForRole, requireUser } from "@/lib/api";

const SYSTEM_STATUSES = [
  "verification_required", "ready_to_transmit", "transmitted", "processing",
  "response_received", "closed", "disputed",
];
const POLICE_STATUSES = ["transmitted", "processing", "response_received", "closed"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const spaces = boSpacesForRole(user.role);
  const canSystem = spaces.includes("system");
  const canPolice = spaces.includes("police");
  if (!canSystem && !canPolice) {
    return apiFail("FORBIDDEN", "Accès non autorisé : espace Système ou Police requis.", 403);
  }
  // Un agent GSM n'a pas vocation à modifier les dossiers ; l'espace actif par
  // défaut est Police pour un compte police, Système sinon.
  const active = canSystem && canPolice
    ? (new URL(req.url).searchParams.get("space") === "police" ? "police" : "system")
    : canPolice ? "police" : "system";

  const { id } = await params;
  const body = await parseBody<{
    status?: string;
    note?: string;
    police_report_ref?: string;
  }>(req);

  const incident = await db.incident.findUnique({
    where: { id },
    include: {
      user: { select: { fullName: true, phone: true, email: true } },
      device: { select: { deviceId: true, brand: true, model: true } },
      _count: { select: { observations: true } },
    },
  });
  if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);

  const data: Record<string, unknown> = {};
  const event: { type: string; label: string; detail?: string; actorRole: string } = {
    type: "status_change",
    label: "",
    detail: body.note?.trim() || undefined,
    actorRole: active === "police" ? "police_officer" : "system",
  };

  if (body.status !== undefined) {
    const allowed = active === "police" ? POLICE_STATUSES : SYSTEM_STATUSES;
    if (!allowed.includes(body.status)) {
      return apiFail("VALIDATION_ERROR", `Statut non autorisé dans cet espace (${allowed.join(", ")}).`, 422);
    }
    if (incident.status === "closed" && body.status !== "disputed") {
      return apiFail("VALIDATION_ERROR", "Dossier déjà clôturé.", 409);
    }
    data.status = body.status;
    if (body.status === "closed") {
      data.closedAt = new Date();
      data.closeReason = body.note?.trim() || "Clôture par le back-office.";
      event.type = "closure";
    }
    event.label = `Statut : ${incident.status} → ${body.status} (back-office ${active === "police" ? "Police" : "Système"})`;
  }

  if (body.police_report_ref !== undefined) {
    if (active !== "police") {
      return apiFail("FORBIDDEN", "La référence de plainte relève de l'espace Police.", 403);
    }
    data.policeReportRef = body.police_report_ref.trim() || null;
    event.label = `Référence de plainte enregistrée : ${body.police_report_ref.trim()}`;
    event.type = "note";
  }

  if (!Object.keys(data).length) return apiFail("VALIDATION_ERROR", "Aucune modification fournie.", 422);

  const updated = await db.incident.update({ where: { id }, data });
  await db.incidentEvent.create({ data: { incidentId: id, ...event } });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "backoffice.incident.update", objectType: "incident", objectId: id,
    reason: event.label + (body.note ? ` — ${body.note}` : ""),
  });

  return ok({
    incident: {
      id: updated.id, refNumber: updated.refNumber, type: updated.type, status: updated.status,
      occurredAt: updated.occurredAt, declaredAt: updated.declaredAt,
      locationText: updated.locationText, policeReportRef: updated.policeReportRef,
      observationsCount: incident._count.observations,
      owner: { fullName: incident.user.fullName, phone: incident.user.phone, email: incident.user.email },
      device: incident.device,
    },
  });
}
