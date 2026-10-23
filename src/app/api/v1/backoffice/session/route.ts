// GET /api/v1/backoffice/session — espaces back-office accessibles à l'utilisateur connecté
import { ok, apiFail, BO_SPACES, boSpacesForRole, requireUser } from "@/lib/api";

const DESCRIPTIONS: Record<string, string> = {
  system: "Pilotage de la plateforme : comptes, dossiers, journal d'audit, demandes RGPD.",
  gsm: "Opérateurs mobiles : demandes SIM/IMEI, localisation réseau autorisée par triangulation.",
  police: "Autorités : dossiers de vol, dépôts de plainte, demandes IMEI, suivi des transmissions.",
};

export async function GET() {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const allowed = boSpacesForRole(user.role);
  return ok({
    user: {
      id: user.id, fullName: user.fullName, role: user.role,
      phone: user.phone, email: user.email, organization: user.organization,
    },
    spaces: (Object.keys(BO_SPACES) as (keyof typeof BO_SPACES)[]).map((key) => ({
      key,
      label: BO_SPACES[key].label,
      description: DESCRIPTIONS[key],
      accessible: allowed.includes(key),
    })),
  });
}
