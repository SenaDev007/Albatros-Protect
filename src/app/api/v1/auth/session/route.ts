// GET /api/v1/auth/session — session courante + sessions actives (F-004)
// DELETE /api/v1/auth/session — déconnexion ; avec {session_id} : révocation ciblée
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authedUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";
import { revokeSession, revokeSessionById, SESSION_COOKIE } from "@/lib/auth";
import { cookies } from "next/headers";

export async function GET() {
  const { user, session } = await authedUser();
  if (!user || !session) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const sessions = await db.session.findMany({
    where: { userId: user.id, revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
    take: 10,
  });
  return ok({
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      email: user.email,
      verifiedAt: user.verifiedAt,
      createdAt: user.createdAt,
    },
    sessions: sessions.map((s) => ({
      id: s.id,
      current: s.id === session.id,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      lastSeenAt: s.lastSeenAt,
    })),
  });
}

export async function DELETE(req: Request) {
  const { user, session } = await authedUser();
  if (!user || !session) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{ session_id?: string }>(req);
  if (body.session_id && body.session_id !== session.id) {
    // Révocation d'une autre session du même compte
    const target = await db.session.findFirst({
      where: { id: body.session_id, userId: user.id },
    });
    if (!target) return apiFail("NOT_FOUND", "Session introuvable.", 404);
    await revokeSessionById(target.id);
    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.session_revoke",
      objectType: "session",
      objectId: target.id,
    });
    return ok({ revoked: body.session_id });
  }
  await revokeSession(session.token);
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "auth.logout",
    objectType: "session",
  });
  return ok({ logout: true });
}
