// DELETE /api/v1/circles/{circleId}/members/{memberId} — retrait / blocage (F-054)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, logAudit } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ circleId: string; memberId: string }> }) {
  const { circleId, memberId } = await params;
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const circle = await db.circle.findFirst({ where: { id: circleId, ownerId: user.id } });
  if (!circle) return apiFail("NOT_FOUND", "Cercle introuvable.", 404);
  const member = await db.circleMembership.findFirst({
    where: { id: memberId, circleId: circle.id },
  });
  if (!member) return apiFail("NOT_FOUND", "Membre introuvable.", 404);
  await db.circleMembership.delete({ where: { id: member.id } });
  // Retirer un membre révoque aussi ses partages en cours (maîtrise du propriétaire)
  await db.shareGrant.updateMany({
    where: { circleId: circle.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "circle.member_remove", objectType: "circle", objectId: circle.id,
    reason: `Retrait de ${member.inviteName} — partages en cours révoqués.`,
  });
  return ok({ removed: true, revoked_shares: true });
}
