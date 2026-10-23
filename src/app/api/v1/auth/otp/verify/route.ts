// POST /api/v1/auth/otp/verify — vérifie l'OTP ; login crée la session, step_up délivre un ticket
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyOtp, createSession, loginOrRegister, issueStepUpTicket } from "@/lib/auth";
import { apiFail, parseBody, logAudit } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await parseBody<{
      identifier?: string;
      code?: string;
      purpose?: "login" | "step_up";
    }>(req);
    const identifier = (body.identifier ?? "").trim();
    const code = (body.code ?? "").trim();
    const purpose = body.purpose === "step_up" ? "step_up" : "login";

    if (!identifier || code.length !== 6) {
      return apiFail("VALIDATION_ERROR", "Code à 6 chiffres attendu.", 422);
    }

    const valid = await verifyOtp(identifier, code, purpose);
    if (!valid) {
      await logAudit({
        actorRole: "anonymous",
        action: "auth.otp_verify",
        objectType: "user",
        result: "failure",
        reason: `Code invalide ou expiré (${purpose})`,
      });
      return apiFail("AUTH_REQUIRED", "Code invalide ou expiré.", 401);
    }

    if (purpose === "step_up") {
      // Vérification renforcée : délivre un ticket à usage unique pour les actions sensibles
      const existing = await db.user.findFirst({
        where: { OR: [{ phone: identifier }, { email: identifier.toLowerCase() }] },
      });
      if (!existing) return apiFail("AUTH_REQUIRED", "Compte introuvable.", 401);
      const ticket = await issueStepUpTicket(existing.id);
      return NextResponse.json({ step_up_verified: true, step_up_ticket: ticket });
    }

    const { user, created } = await loginOrRegister(identifier);
    await createSession(user.id, req.headers.get("user-agent") ?? undefined);
    await logAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "auth.login",
      objectType: "session",
      reason: created ? "Nouveau compte vérifié" : "Connexion OTP",
    });
    return NextResponse.json({
      user: { id: user.id, fullName: user.fullName, role: user.role, phone: user.phone, email: user.email },
      created,
    });
  } catch (e) {
    console.error("[albatros] otp/verify failed:", e);
    return apiFail("INTERNAL_ERROR", "Erreur serveur.", 500);
  }
}
