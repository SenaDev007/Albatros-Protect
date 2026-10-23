// PATCH /api/v1/console/incidents/{incidentId} — transitions de statut par la console
// Chaque action support est journalisée avec motif (F-075)
import { db } from "@/lib/db";
import { requireStaff, ok, apiFail, parseBody, logAudit } from "@/lib/api";
import { INCIDENT_STATUSES } from "@/lib/albatros";

const STAFF_STATUSES = [
  "verification_required",
  "ready_to_transmit",
  "transmitted",
  "processing",
  "response_received",
  "closed",
  "disputed",
];

export async function PATCH(req: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  const staff = await requireStaff();
  if (!staff) return apiFail("FORBIDDEN", "Accès réservé au personnel habilité.", 403);
  const incident = await db.incident.findFirst({ where: { id: incidentId } });
  if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);
  const body = await parseBody<{ status?: string; note?: string; reason?: string }>(req);

  if (!body.status || !STAFF_STATUSES.includes(body.status)) {
    return apiFail("VALIDATION_ERROR", `Statut attendu parmi : ${STAFF_STATUSES.join(", ")}.`, 422);
  }
  const label = INCIDENT_STATUSES[body.status as keyof typeof INCIDENT_STATUSES]?.label ?? body.status;
  const updated = await db.incident.update({
    where: { id: incident.id },
    data: {
      status: body.status,
      closedAt: body.status === "closed" ? new Date() : null,
      closeReason: body.status === "closed" ? body.note ?? "Clôture par la console." : undefined,
    },
  });
  await db.incidentEvent.create({
    data: {
      incidentId: incident.id,
      type: "status_change",
      label: `Statut : ${label}`,
      detail: body.note ?? null,
      actorRole: "support",
    },
  });
  await logAudit({
    actorId: staff.id, actorRole: staff.role,
    action: "incident.status_change", objectType: "incident", objectId: incident.id,
    reason: body.reason ?? `Transition console vers « ${label} »`,
  });
  return ok({ incident: updated });
}
