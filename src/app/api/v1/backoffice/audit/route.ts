// GET /api/v1/backoffice/audit?limit=60 — journal d'audit consolidé (espace Système)
import { db } from "@/lib/db";
import { ok, apiFail, requireBoSpace } from "@/lib/api";

export async function GET(req: Request) {
  const { user, space } = await requireBoSpace("system");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);

  const limit = Math.min(200, Math.max(10, Number(new URL(req.url).searchParams.get("limit")) || 60));
  const events = await db.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { actor: { select: { fullName: true } } },
  });

  return ok({
    events: events.map((e) => ({
      id: e.id,
      actorRole: e.actorRole,
      action: e.action,
      objectType: e.objectType,
      objectId: e.objectId,
      result: e.result,
      reason: e.reason,
      createdAt: e.createdAt,
      actor: e.actor ? { fullName: e.actor.fullName } : null,
    })),
  });
}
