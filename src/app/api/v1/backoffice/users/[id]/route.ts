// PATCH /api/v1/backoffice/users/{id} — gestion des rôles (espace Système, admin uniquement)
import { db } from "@/lib/db";
import { ok, apiFail, parseBody, logAudit, requireBoSpace } from "@/lib/api";

const VALID_ROLES = ["citizen", "support", "admin", "gsm_operator", "police_officer"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, space } = await requireBoSpace("system");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);
  if (user.role !== "admin") {
    return apiFail("FORBIDDEN", "Seul un administrateur système peut modifier les rôles.", 403);
  }

  const { id } = await params;
  const body = await parseBody<{ role?: string; organization?: string; full_name?: string }>(req);
  const target = await db.user.findUnique({ where: { id } });
  if (!target) return apiFail("NOT_FOUND", "Compte introuvable.", 404);

  const data: Record<string, unknown> = {};
  if (body.role !== undefined) {
    if (!VALID_ROLES.includes(body.role)) return apiFail("VALIDATION_ERROR", "Rôle inconnu.", 422);
    if (target.id === user.id && body.role !== "admin") {
      return apiFail("VALIDATION_ERROR", "Impossible de retirer votre propre rôle administrateur.", 422);
    }
    data.role = body.role;
  }
  if (body.organization !== undefined) data.organization = body.organization.trim() || null;
  if (body.full_name !== undefined && body.full_name.trim()) data.fullName = body.full_name.trim();
  if (!Object.keys(data).length) return apiFail("VALIDATION_ERROR", "Aucune modification fournie.", 422);

  const updated = await db.user.update({ where: { id }, data });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "backoffice.user.update", objectType: "user", objectId: id,
    reason: `Champs : ${Object.keys(data).join(", ")}`,
  });
  return ok({
    user: {
      id: updated.id, fullName: updated.fullName, phone: updated.phone, email: updated.email,
      role: updated.role, organization: updated.organization,
      verifiedAt: updated.verifiedAt, createdAt: updated.createdAt,
    },
  });
}
