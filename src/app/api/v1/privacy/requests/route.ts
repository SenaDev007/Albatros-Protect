// GET/POST /api/v1/privacy/requests — exercice des droits (§9.2, F-066)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const requests = await db.privacyRequest.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return ok({ requests });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{ type?: string; details?: string }>(req);
  const type = body.type ?? "";
  if (!["access", "rectification", "deletion", "objection"].includes(type)) {
    return apiFail("VALIDATION_ERROR", "Type de demande invalide.", 422);
  }
  const request = await db.privacyRequest.create({
    data: {
      userId: user.id,
      type,
      details: (body.details ?? "").trim() || "Aucun détail fourni.",
      status: "received",
    },
  });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: `privacy.${type}`, objectType: "privacy_request", objectId: request.id,
  });
  return ok({
    request,
    notice:
      "Votre demande est enregistrée et sera traitée dans le cadre légal applicable (Code du numérique béninois, formalités APDP).",
  }, 201);
}
