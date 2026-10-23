// GET /api/v1/incidents/{incidentId} — dossier complet (chronologie, observations, partenaires)
// PATCH — rectification / clôture / annulation (F-066)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

async function ctx(params: Promise<{ incidentId: string }>) {
  const { incidentId } = await params;
  const user = await requireUser();
  if (!user) return { user: null, incident: null };
  const incident = await db.incident.findFirst({
    where: { OR: [{ id: incidentId }, { refNumber: incidentId }], userId: user.id },
    include: { device: true },
  });
  return { user, incident };
}

export async function GET(_req: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const { user, incident } = await ctx(params);
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);
  const [events, observations, partnerRequests, documents, identifiers] = await Promise.all([
    db.incidentEvent.findMany({ where: { incidentId: incident.id }, orderBy: { createdAt: "asc" } }),
    db.locationObservation.findMany({
      where: { OR: [{ incidentId: incident.id }, { deviceId: incident.deviceId }] },
      orderBy: { capturedAt: "desc" },
      take: 30,
    }),
    db.partnerRequest.findMany({ where: { incidentId: incident.id } }),
    db.documentEntity.findMany({ where: { OR: [{ incidentId: incident.id }, { deviceId: incident.deviceId }] } }),
    db.deviceIdentifier.findMany({ where: { deviceId: incident.deviceId } }),
  ]);
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "incident.view", objectType: "incident", objectId: incident.id,
  });
  return ok({ incident, events, observations, partnerRequests, documents, identifiers });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const { user, incident } = await ctx(params);
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);
  const body = await parseBody<{
    action?: "update" | "close" | "cancel" | "dispute";
    description?: string;
    location_text?: string;
    sim_phone?: string;
    police_report_ref?: string;
    close_reason?: string;
    submit_draft?: boolean;
  }>(req);

  if (incident.status === "closed" && body.action !== "dispute") {
    return apiFail("VALIDATION_ERROR", "Dossier déjà clôturé.", 409);
  }

  const data: Record<string, unknown> = {};
  const events: { type: string; label: string; detail?: string }[] = [];

  if (body.action === "update" || body.action === undefined) {
    if (body.description !== undefined) { data.description = body.description; events.push({ type: "note", label: "Description rectifiée" }); }
    if (body.location_text !== undefined) { data.locationText = body.location_text; events.push({ type: "note", label: "Lieu rectifié" }); }
    if (body.sim_phone !== undefined) { data.simPhone = body.sim_phone; events.push({ type: "note", label: "Numéro SIM mis à jour" }); }
    if (body.police_report_ref !== undefined) {
      data.policeReportRef = body.police_report_ref;
      events.push({ type: "note", label: "Référence de plainte ajoutée", detail: body.police_report_ref || null });
    }
    if (body.submit_draft && incident.status === "draft") {
      data.status = "submitted";
      events.push({ type: "status_change", label: "Brouillon soumis", detail: "Le signalement est confirmé par le propriétaire." });
    }
  } else if (body.action === "cancel") {
    // Perte retrouvée : annulation/clôture (F-066)
    data.status = "closed";
    data.closedAt = new Date();
    data.closeReason = "Perte annulée : appareil retrouvé.";
    events.push({ type: "closure", label: "Signalement annulé — appareil retrouvé", detail: "Le propriétaire confirme la récupération de l'appareil." });
  } else if (body.action === "close") {
    data.status = "closed";
    data.closedAt = new Date();
    data.closeReason = body.close_reason?.trim() || "Clôture demandée par le propriétaire.";
    events.push({ type: "closure", label: "Dossier clôturé", detail: body.close_reason || null });
  } else if (body.action === "dispute") {
    data.status = "disputed";
    events.push({ type: "status_change", label: "Dossier contesté", detail: "Le propriétaire conteste une décision ou une information du dossier." });
  }

  const updated = await db.incident.update({ where: { id: incident.id }, data });
  for (const e of events) {
    await db.incidentEvent.create({
      data: { incidentId: incident.id, ...e, actorRole: "owner" },
    });
  }
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: `incident.${body.action ?? "update"}`, objectType: "incident", objectId: incident.id,
  });
  return ok({ incident: updated });
}
