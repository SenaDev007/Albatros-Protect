// GET /api/v1/incidents — dossiers du propriétaire
// POST /api/v1/incidents — signalement (F-060), exige une vérification renforcée (F-003)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit, incidentRefNumber } from "@/lib/api";
import { validateStepUpTicket, consumeStepUpTicket } from "@/lib/auth";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const incidents = await db.incident.findMany({
    where: { userId: user.id },
    orderBy: { declaredAt: "desc" },
    include: { device: true, partnerRequests: true },
  });
  const openIds = incidents.filter((i) => !["closed", "draft"].includes(i.status));
  const observations = openIds.length
    ? await db.locationObservation.findMany({
        where: { incidentId: { in: openIds.map((i) => i.id) } },
        orderBy: { capturedAt: "desc" },
      })
    : [];
  const lastByIncident = new Map<string, (typeof observations)[number]>();
  for (const o of observations) if (!lastByIncident.has(o.incidentId ?? "")) lastByIncident.set(o.incidentId ?? "", o);
  return ok({
    incidents: incidents.map((i) => ({
      ...i,
      lastObservation: lastByIncident.get(i.id) ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{
    device_id?: string;
    type?: "loss" | "theft";
    status?: "draft" | "submitted";
    occurred_at?: string;
    location_text?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
    sim_phone?: string;
    police_report_ref?: string;
    step_up_ticket?: string;
  }>(req);

  if (!body.device_id || !["loss", "theft"].includes(body.type ?? "")) {
    return apiFail("VALIDATION_ERROR", "Appareil et type (perte/vol) requis.", 422);
  }
  const device = await db.device.findFirst({
    where: { OR: [{ id: body.device_id }, { deviceId: body.device_id }], ownerId: user.id, status: "active" },
  });
  if (!device) return apiFail("NOT_FOUND", "Appareil actif introuvable.", 404);

  const openIncident = await db.incident.findFirst({
    where: { deviceId: device.id, status: { notIn: ["closed", "draft"] } },
  });
  if (openIncident) {
    return apiFail("VALIDATION_ERROR",
      `Un dossier est déjà ouvert pour cet appareil (${openIncident.refNumber}).`, 409);
  }

  const isDraft = body.status === "draft";
  if (!isDraft) {
    // Action sensible : vérification renforcée obligatoire (F-003)
    if (!body.step_up_ticket) return apiFail("STEP_UP_REQUIRED", "Vérification renforcée requise.", 428);
    const valid = await validateStepUpTicket(body.step_up_ticket);
    if (!valid) return apiFail("STEP_UP_REQUIRED", "Ticket de vérification invalide ou expiré.", 428);
  }

  const refNumber = isDraft ? `BROUILLON-${Date.now().toString(36).toUpperCase()}` : await incidentRefNumber();
  const incident = await db.incident.create({
    data: {
      refNumber,
      userId: user.id,
      deviceId: device.id,
      type: body.type as string,
      status: isDraft ? "draft" : "submitted",
      occurredAt: body.occurred_at ? new Date(body.occurred_at) : new Date(),
      locationText: (body.location_text ?? "").trim() || "Non précisé",
      latitude: typeof body.latitude === "number" ? body.latitude : null,
      longitude: typeof body.longitude === "number" ? body.longitude : null,
      description: body.description?.trim() || null,
      simPhone: body.sim_phone?.trim() || null,
      policeReportRef: body.police_report_ref?.trim() || null,
    },
  });
  await db.incidentEvent.create({
    data: {
      incidentId: incident.id,
      type: "created",
      label: isDraft ? "Brouillon créé" : `Signalement ${body.type === "theft" ? "de vol" : "de perte"} confirmé`,
      detail: isDraft
        ? "Brouillon enregistré — aucune transmission tant que le dossier n'est pas confirmé."
        : "Authentification renforcée validée par OTP (F-003).",
      actorRole: "owner",
    },
  });

  if (!isDraft && body.step_up_ticket) await consumeStepUpTicket(body.step_up_ticket);

  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "incident.create", objectType: "incident", objectId: incident.id,
    reason: `Signalement ${body.type} — ${refNumber}`,
  });
  return ok({
    incident,
    immediate_actions: [
      "Sécurisez vos comptes en ligne (email, réseaux sociaux, banque) depuis un autre appareil.",
      "Contactez votre opérateur pour suspendre la SIM (au pilote : suivez les instructions exportables).",
      "Retrouvez l'IMEI dans les documents d'achat ou l'emballage d'origine.",
      "Déposez une plainte auprès des autorités compétentes si vol.",
      "Ne vous rendez jamais seul vers une position — alertez les autorités (critère 12 du pilote).",
    ],
  }, 201);
}
