// Agent Albatros — helpers API serveur (réponses, garde d'auth, audit)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export type ApiErrorCode =
  | "PERMISSION_MISSING"
  | "LOCATION_UNAVAILABLE"
  | "RADIO_INPUT_UNAVAILABLE"
  | "GOOGLE_QUOTA_EXCEEDED"
  | "GOOGLE_PROVIDER_UNAVAILABLE"
  | "DEVICE_NOT_ENROLLED"
  | "INCIDENT_NOT_VERIFIED"
  | "CONSENT_REVOKED"
  | "PARTNER_FLOW_NOT_ENABLED"
  | "AUTH_REQUIRED"
  | "STEP_UP_REQUIRED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "INTERNAL_ERROR";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data as object, { status });
}

export function apiFail(code: ApiErrorCode, message?: string, status = 400) {
  return NextResponse.json(
    { error: code, message: message ?? code },
    { status }
  );
}

export async function authedUser() {
  const session = await getSession();
  if (!session) return { user: null, session: null };
  // Rafraîchit lastSeenAt sans bloquer la réponse
  db.session
    .update({ where: { id: session.id }, data: { lastSeenAt: new Date() } })
    .catch(() => {});
  return { user: session.user, session };
}

export async function requireUser() {
  const { user } = await authedUser();
  return user;
}

export async function requireStaff() {
  const user = await requireUser();
  if (!user) return null;
  return user.role === "support" || user.role === "admin" ? user : null;
}

export async function logAudit(entry: {
  actorId?: string | null;
  actorRole: string;
  action: string;
  objectType: string;
  objectId?: string | null;
  result?: string;
  reason?: string | null;
}) {
  try {
    await db.auditEvent.create({
      data: {
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole,
        action: entry.action,
        objectType: entry.objectType,
        objectId: entry.objectId ?? null,
        result: entry.result ?? "success",
        reason: entry.reason ?? null,
      },
    });
  } catch {
    // le journal ne doit jamais casser une requête utilisateur
  }
}

export function parseBody<T>(req: Request): Promise<T> {
  return req.json().catch(() => ({} as T));
}

export async function incidentRefNumber() {
  const year = new Date().getFullYear();
  const count = await db.incident.count({
    where: { refNumber: { contains: `ALB-INC-${year}` } },
  });
  return `ALB-INC-${year}-${String(count + 1).padStart(4, "0")}`;
}
