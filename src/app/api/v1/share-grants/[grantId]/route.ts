// DELETE /api/v1/share-grants/{grantId} — révocation immédiate (F-051)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, logAudit } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ grantId: string }> }) {
  const { grantId } = await params;
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const grant = await db.shareGrant.findFirst({ where: { id: grantId, userId: user.id } });
  if (!grant) return apiFail("NOT_FOUND", "Partage introuvable.", 404);
  await db.shareGrant.update({ where: { id: grant.id }, data: { revokedAt: new Date() } });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "share_grant.revoke", objectType: "circle", objectId: grant.circleId,
    reason: "Révocation immédiate par le propriétaire",
  });
  return ok({ revoked: true });
}
