// PATCH /api/v1/backoffice/privacy-requests/{id} — traitement RGPD (espace Système)
import { db } from "@/lib/db";
import { ok, apiFail, parseBody, logAudit, requireBoSpace } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, space } = await requireBoSpace("system");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);

  const { id } = await params;
  const body = await parseBody<{ status?: string; note?: string }>(req);
  if (!body.status || !["received", "processing", "done"].includes(body.status)) {
    return apiFail("VALIDATION_ERROR", "Statut requis (received | processing | done).", 422);
  }

  const existing = await db.privacyRequest.findUnique({ where: { id } });
  if (!existing) return apiFail("NOT_FOUND", "Demande introuvable.", 404);

  const updated = await db.privacyRequest.update({
    where: { id },
    data: { status: body.status },
  });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "backoffice.privacy_request.update", objectType: "privacy_request", objectId: id,
    reason: `Statut : ${existing.status} → ${body.status}${body.note ? ` — ${body.note}` : ""}`,
  });

  return ok({
    request: {
      id: updated.id, type: updated.type, details: updated.details,
      status: updated.status, createdAt: updated.createdAt,
      user: { fullName: "", phone: null, email: null },
    },
  });
}
