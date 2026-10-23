// POST /api/v1/incidents/{incidentId}/partner-requests — préparation d'une demande
// opérateur/autorité (F-071…F-076). Aucune transmission sans convention : PARTNER_FLOW_NOT_ENABLED.
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

export async function POST(req: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const incident = await db.incident.findFirst({
    where: { OR: [{ id: incidentId }, { refNumber: incidentId }], userId: user.id },
  });
  if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);
  const body = await parseBody<{
    partner_type?: "operator" | "authority";
    partner_name?: string;
    request_type?: string;
    motive?: string;
  }>(req);
  if (!body.partner_type || !body.partner_name || !body.request_type) {
    return apiFail("VALIDATION_ERROR", "Type de partenaire, nom et type de demande requis.", 422);
  }

  const record = await db.partnerRequest.create({
    data: {
      incidentId: incident.id,
      partnerType: body.partner_type,
      partnerName: body.partner_name,
      requestType: body.request_type,
      base: "declaration_du_proprietaire",
      motive: body.motive?.trim() || `Demande liée au dossier ${incident.refNumber}`,
      status: "inactive",
      note: "Préparée au pilote — flux de transmission inactif tant qu'aucune convention n'est signée.",
    },
  });
  await db.incidentEvent.create({
    data: {
      incidentId: incident.id,
      type: "partner",
      label: `Demande ${body.partner_name} préparée (inactive)`,
      detail:
        "La demande est enregistrée pour préparation. Aucune transmission au réseau n'a lieu sans convention signée et cadre légal validé (F-076).",
      actorRole: "system",
    },
  });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "partner_request.prepare", objectType: "incident", objectId: incident.id,
    reason: `${body.partner_name} — ${body.request_type}`,
  });
  return ok({
    partner_request: record,
    enabled: false,
    error: "PARTNER_FLOW_NOT_ENABLED",
    message:
      "Aucun parcours partenaire n'est actif sans convention écrite. Utilisez le dossier exportable et les instructions officielles pour saisir l'opérateur ou les autorités.",
  }, 201);
}
