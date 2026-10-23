// GET /api/v1/consents — consentements de l'utilisateur
// POST /api/v1/consents — enregistre un consentement explicite
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const consents = await db.consentRecord.findMany({
    where: { userId: user.id },
    orderBy: { grantedAt: "desc" },
  });
  return ok({ consents });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{ purpose?: string; permission?: string; device_id?: string }>(req);
  if (!body.purpose) return apiFail("VALIDATION_ERROR", "Finalité requise.", 422);
  const consent = await db.consentRecord.create({
    data: {
      userId: user.id,
      deviceId: body.device_id ?? null,
      purpose: body.purpose,
      permission: body.permission ?? "consentement_explicite",
      textVersion: "v1.1",
    },
  });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "consent.grant", objectType: "consent", objectId: consent.id,
    reason: body.purpose,
  });
  return ok({ consent }, 201);
}
