// GET /api/v1/circles — cercles du propriétaire
// POST /api/v1/circles — création d'un cercle facultatif (F-050)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const circles = await db.circle.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      members: true,
      shareGrants: { where: { revokedAt: null, expiresAt: { gt: new Date() } } },
    },
  });
  return ok({ circles });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{ name?: string }>(req);
  const name = (body.name ?? "").trim();
  if (!name || name.length < 2) return apiFail("VALIDATION_ERROR", "Nom du cercle requis.", 422);
  const circle = await db.circle.create({ data: { ownerId: user.id, name } });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "circle.create", objectType: "circle", objectId: circle.id,
  });
  return ok({ circle }, 201);
}
