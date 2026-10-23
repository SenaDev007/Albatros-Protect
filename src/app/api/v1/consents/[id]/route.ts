// DELETE /api/v1/consents/{id} — révocation immédiate (F-024, §4.2)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, logAudit } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const consent = await db.consentRecord.findFirst({ where: { id, userId: user.id } });
  if (!consent) return apiFail("NOT_FOUND", "Consentement introuvable.", 404);
  await db.consentRecord.update({
    where: { id },
    data: { revokedAt: new Date(), granted: false },
  });
  if (consent.deviceId && consent.purpose === "location") {
    await db.device.update({
      where: { id: consent.deviceId },
      data: { locationEnabled: false },
    });
  }
  if (consent.deviceId && consent.purpose === "ble_detection") {
    await db.device.update({
      where: { id: consent.deviceId },
      data: { bleEnabled: false },
    });
  }
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "consent.revoke", objectType: "consent", objectId: id,
    reason: `Révocation ${consent.purpose}`,
  });
  return ok({ revoked: true });
}
