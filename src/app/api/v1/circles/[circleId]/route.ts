// GET/DELETE /api/v1/circles/{circleId}
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, logAudit } from "@/lib/api";

async function ctx(params: Promise<{ circleId: string }>) {
  const { circleId } = await params;
  const user = await requireUser();
  if (!user) return { user: null, circle: null };
  const circle = await db.circle.findFirst({ where: { id: circleId, ownerId: user.id } });
  return { user, circle };
}

export async function GET(_req: Request, { params }: { params: Promise<{ circleId: string }> }) {
  const { user, circle } = await ctx(params);
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!circle) return apiFail("NOT_FOUND", "Cercle introuvable.", 404);
  const [members, shareGrants] = await Promise.all([
    db.circleMembership.findMany({ where: { circleId: circle.id }, orderBy: { createdAt: "desc" } }),
    db.shareGrant.findMany({ where: { circleId: circle.id }, orderBy: { createdAt: "desc" } }),
  ]);
  return ok({ circle, members, shareGrants });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ circleId: string }> }) {
  const { user, circle } = await ctx(params);
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!circle) return apiFail("NOT_FOUND", "Cercle introuvable.", 404);
  await db.circle.delete({ where: { id: circle.id } }); // cascade : membres + partages
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "circle.delete", objectType: "circle", objectId: circle.id,
  });
  return ok({ deleted: true });
}
