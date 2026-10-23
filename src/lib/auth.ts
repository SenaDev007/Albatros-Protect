// Agent Albatros — Authentification (OTP + sessions + vérification renforcée F-003)
import { cookies } from "next/headers";
import { randomBytes, randomInt } from "crypto";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "albatros_session";
const SESSION_TTL_DAYS = 30;
const OTP_TTL_MIN = 10;
const STEPUP_TICKET_TTL_MIN = 15;

type Purpose = "login" | "step_up" | "step_up_ticket";

export async function createSession(userId: string, userAgent?: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000);
  const session = await db.session.create({
    data: { token, userId, userAgent: userAgent ?? null, expiresAt },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_DAYS * 86400,
  });
  return session;
}

export async function getSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  return session;
}

export async function revokeSession(token: string) {
  await db.session.updateMany({
    where: { token, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function revokeSessionById(id: string) {
  await db.session.updateMany({
    where: { id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// ---- OTP ----

export async function startOtp(identifier: string, purpose: Purpose) {
  // Invalide les codes précédents non consommés pour ce même usage
  await db.otpCode.updateMany({
    where: { identifier, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  const code = String(randomInt(100000, 999999));
  await db.otpCode.create({
    data: {
      identifier,
      code,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60000),
    },
  });
  // Mode pilote : le code est retourné pour affichage à l'écran au lieu d'un SMS réel.
  return code;
}

export async function verifyOtp(identifier: string, code: string, purpose: Purpose) {
  const rec = await db.otpCode.findFirst({
    where: {
      identifier,
      code,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (!rec) return false;
  await db.otpCode.update({ where: { id: rec.id }, data: { consumedAt: new Date() } });
  return true;
}

/** Délivre un ticket à usage unique (15 min) après vérification renforcée. */
export async function issueStepUpTicket(userId: string) {
  const ticket = randomBytes(16).toString("hex");
  await db.otpCode.create({
    data: {
      identifier: userId,
      code: ticket,
      purpose: "step_up_ticket",
      expiresAt: new Date(Date.now() + STEPUP_TICKET_TTL_MIN * 60000),
    },
  });
  return ticket;
}

/** Valide un ticket renforcé sans le consommer (consommé après succès de l'action). */
export async function validateStepUpTicket(ticket: string) {
  const rec = await db.otpCode.findFirst({
    where: {
      code: ticket,
      purpose: "step_up_ticket",
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  return !!rec;
}

export async function consumeStepUpTicket(ticket: string) {
  await db.otpCode.updateMany({
    where: { code: ticket, purpose: "step_up_ticket", consumedAt: null },
    data: { consumedAt: new Date() },
  });
}

/** Trouve un utilisateur par téléphone ou email ; null sinon. */
export async function findUserByIdentifier(identifier: string) {
  const id = identifier.trim().toLowerCase();
  return db.user.findFirst({
    where: { OR: [{ phone: identifier.trim() }, { email: id }] },
  });
}

export async function loginOrRegister(identifier: string) {
  const existing = await findUserByIdentifier(identifier);
  if (existing) return { user: existing, created: false };
  const isEmail = identifier.includes("@");
  const user = await db.user.create({
    data: {
      email: isEmail ? identifier.trim().toLowerCase() : null,
      phone: isEmail ? null : identifier.trim(),
      fullName: "Nouvel utilisateur",
      role: "citizen",
      verifiedAt: new Date(),
    },
  });
  return { user, created: true };
}
