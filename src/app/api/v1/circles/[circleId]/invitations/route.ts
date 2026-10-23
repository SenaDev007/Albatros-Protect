// POST /api/v1/circles/{circleId}/invitations — invitation révocable (F-023/F-051)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ circleId: string }> }) {
  const { circleId } = await params;
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const circle = await db.circle.findFirst({ where: { id: circleId, ownerId: user.id } });
  if (!circle) return apiFail("NOT_FOUND", "Cercle introuvable.", 404);
  const body = await parseBody<{ name?: string; contact?: string }>(req);
  const name = (body.name ?? "").trim();
  const contact = (body.contact ?? "").trim();
  if (!name || !contact) return apiFail("VALIDATION_ERROR", "Nom et contact requis.", 422);
  const membership = await db.circleMembership.create({
    data: { circleId: circle.id, inviteName: name, inviteContact: contact, status: "invited" },
  });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "circle.invite", objectType: "circle", objectId: circle.id,
    reason: `Invitation de ${name} — l'invitation est révocable ; aucune position n'est partagée par défaut.`,
  });
  return ok({
    membership,
    notice:
      "Le proche doit accepter explicitement. L'adhésion ne donne accès à aucune position par défaut (F-023).",
  }, 201);
}
