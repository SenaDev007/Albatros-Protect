// GET /api/v1/backoffice/privacy-requests — demandes d'exercice de droits (espace Système)
import { db } from "@/lib/db";
import { ok, apiFail, requireBoSpace } from "@/lib/api";

export async function GET() {
  const { user, space } = await requireBoSpace("system");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);

  const requests = await db.privacyRequest.findMany({
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: { user: { select: { fullName: true, phone: true, email: true } } },
  });

  return ok({
    requests: requests.map((r) => ({
      id: r.id, type: r.type, details: r.details, status: r.status, createdAt: r.createdAt,
      user: { fullName: r.user.fullName, phone: r.user.phone, email: r.user.email },
    })),
  });
}
