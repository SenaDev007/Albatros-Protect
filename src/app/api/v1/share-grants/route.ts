// GET /api/v1/share-grants — partages actifs
// POST /api/v1/share-grants — partage explicite, limité dans le temps (F-051) — vérification renforcée
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";
import { validateStepUpTicket, consumeStepUpTicket } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const grants = await db.shareGrant.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { circle: true, incident: true },
  });
  return ok({ grants });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{
    circle_id?: string;
    incident_id?: string;
    device_id?: string;
    data_shared?: "alert" | "status" | "position";
    duration_hours?: number;
    step_up_ticket?: string;
  }>(req);

  if (!body.circle_id || !["alert", "status", "position"].includes(body.data_shared ?? "")) {
    return apiFail("VALIDATION_ERROR", "Cercle et type de partage (alerte|statut|position) requis.", 422);
  }
  const circle = await db.circle.findFirst({ where: { id: body.circle_id, ownerId: user.id } });
  if (!circle) return apiFail("NOT_FOUND", "Cercle introuvable.", 404);

  // Partage = action sensible : vérification renforcée (F-003)
  if (!body.step_up_ticket) return apiFail("STEP_UP_REQUIRED", "Vérification renforcée requise pour un partage.", 428);
  const valid = await validateStepUpTicket(body.step_up_ticket);
  if (!valid) return apiFail("STEP_UP_REQUIRED", "Ticket de vérification invalide ou expiré.", 428);

  if (body.incident_id) {
    const incident = await db.incident.findFirst({ where: { id: body.incident_id, userId: user.id } });
    if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);
  }

  const hours = Math.max(1, Math.min(72, body.duration_hours ?? 24));
  const grant = await db.shareGrant.create({
    data: {
      circleId: circle.id,
      userId: user.id,
      incidentId: body.incident_id ?? null,
      deviceId: body.device_id ?? null,
      dataShared: body.data_shared as string,
      expiresAt: new Date(Date.now() + hours * 3600 * 1000),
    },
  });
  await consumeStepUpTicket(body.step_up_ticket);
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "share_grant.create", objectType: "circle", objectId: circle.id,
    reason: `Partage ${body.data_shared} pour ${hours} h — expirable et révocable.`,
  });
  return ok({
    grant,
    notice:
      "Le partage expire automatiquement. Les membres ne voient que ce qui a été explicitement partagé — jamais l'historique complet.",
  }, 201);
}
