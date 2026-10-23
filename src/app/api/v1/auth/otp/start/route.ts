// POST /api/v1/auth/otp/start — démarre une vérification OTP (login ou renforcée)
import { NextResponse } from "next/server";
import { startOtp } from "@/lib/auth";
import { logAudit, apiFail, parseBody } from "@/lib/api";

export async function POST(req: Request) {
  try {
    const body = await parseBody<{ identifier?: string; purpose?: "login" | "step_up" }>(req);
    const identifier = (body.identifier ?? "").trim();
    if (!identifier || identifier.length < 5) {
      return apiFail("VALIDATION_ERROR", "Numéro de téléphone ou email invalide.", 422);
    }
    const purpose = body.purpose === "step_up" ? "step_up" : "login";
    const code = await startOtp(identifier, purpose);
    await logAudit({
      actorRole: "anonymous",
      action: "auth.otp_start",
      objectType: "user",
      reason: `OTP émis (${purpose})`,
    });
    // Mode pilote : le code est affiché à l'écran au lieu d'être envoyé par SMS/email réel.
    return NextResponse.json({
      sent: true,
      purpose,
      demo_code: code,
      demo_notice:
        "Pilote : le code est affiché ici au lieu d'un envoi SMS/email réel.",
    });
  } catch {
    return apiFail("INTERNAL_ERROR", "Erreur serveur.", 500);
  }
}
