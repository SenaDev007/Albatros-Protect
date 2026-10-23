// PATCH /api/v1/backoffice/partner-requests/{id} — traitement d'une demande partenaire
// GSM : répondre (avec position réseau triangulée si localisation) ou refuser.
// Police : traiter les demandes autorités. Système : vue + transmission.
import { db } from "@/lib/db";
import { ok, apiFail, parseBody, logAudit, requireBoSpace } from "@/lib/api";
import { runTriangulation } from "@/lib/geo";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  sim_suspension: "Suspension SIM",
  imei_block: "Blocage IMEI",
  network_location: "Localisation réseau",
};

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { user, space } = await requireBoSpace("gsm");
  const policeCtx = space ? { user, space } : await requireBoSpace("police");
  const active = space ?? policeCtx.space;
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!active) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);

  const { id } = await params;
  const body = await parseBody<{
    action?: "transmit" | "answer" | "refuse";
    response_note?: string;
    /** Localisation réseau : triangulation réalisée par l'opérateur (espace GSM). */
    with_position?: boolean;
  }>(req);

  const request = await db.partnerRequest.findUnique({
    where: { id },
    include: { incident: { include: { device: true } } },
  });
  if (!request) return apiFail("NOT_FOUND", "Demande introuvable.", 404);

  // Ségrégation des espaces : GSM traite les demandes opérateurs,
  // Police traite les demandes autorités, le Système voit tout.
  if (active === "gsm" && request.partnerType !== "operator") {
    return apiFail("FORBIDDEN", "Cette demande relève de l'espace Police.", 403);
  }
  if (active === "police" && request.partnerType !== "authority") {
    return apiFail("FORBIDDEN", "Cette demande relève de l'espace GSM.", 403);
  }

  const action = body.action ?? "answer";
  const now = new Date();
  const data: Record<string, unknown> = {};
  let eventLabel = "";
  let eventDetail = body.response_note?.trim() || undefined;
  let observation: unknown = null;

  if (action === "transmit") {
    if (request.status === "answered" || request.status === "refused") {
      return apiFail("VALIDATION_ERROR", "Demande déjà traitée.", 409);
    }
    data.status = "transmitted";
    data.transmittedAt = now;
    eventLabel = `Demande transmise au partenaire ${request.partnerName} (${REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType})`;
  } else if (action === "answer" || action === "refuse") {
    if (request.status === "answered" || request.status === "refused") {
      return apiFail("VALIDATION_ERROR", "Demande déjà traitée.", 409);
    }
    data.status = action === "refuse" ? "refused" : "answered";
    data.processedAt = now;
    data.processedBy = user.id;
    data.responseNote = body.response_note?.trim() || null;

    // Localisation réseau : l'opérateur produit une position autorisée
    // par triangulation de son réseau (moteur interne, simulation pilote).
    if (action === "answer" && request.requestType === "network_location" && body.with_position) {
      if (active !== "gsm" && user.role !== "admin") {
        return apiFail("FORBIDDEN", "La localisation réseau relève de l'espace GSM.", 403);
      }
      const incident = request.incident;
      const last = incident.latitude != null && incident.longitude != null
        ? { lat: incident.latitude, lng: incident.longitude }
        : incident.device
          ? (await db.locationObservation.findFirst({
              where: { deviceId: incident.device.id },
              orderBy: { capturedAt: "desc" },
            })) ?? null
          : null;
      const reference = last?.latitude != null
        ? { lat: last.latitude, lng: last.longitude }
        : { lat: incident.latitude ?? 9.3433, lng: incident.longitude ?? 2.6089 };

      const tri = runTriangulation(reference, 4, 4);
      const created = await db.locationObservation.create({
        data: {
          deviceId: incident.deviceId,
          incidentId: incident.id,
          source: "operator_authorized",
          latitude: tri.point.lat,
          longitude: tri.point.lng,
          accuracyRadiusM: Math.round(tri.accuracyRadiusM),
          capturedAt: now,
          receivedAt: now,
          mode: "incident",
          quality: "approximate",
          note: `Position communiquée par ${request.partnerName} — localisation réseau légale (triangulation ${tri.anchors.length} ancres, résidu RMS ${tri.residualRmsM} m).`,
        },
      });
      observation = created;
      data.responseNote = `${data.responseNote ?? ""} Position réseau transmise : ±${Math.round(tri.accuracyRadiusM)} m.`.trim();
      eventDetail = `Localisation réseau communiquée (±${Math.round(tri.accuracyRadiusM)} m) — visible par le propriétaire sur la carte protégée.`;
    }

    eventLabel = action === "refuse"
      ? `Demande refusée par ${request.partnerName}`
      : `Demande traitée par ${request.partnerName} (${REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType})`;
  } else {
    return apiFail("VALIDATION_ERROR", "Action inconnue (transmit | answer | refuse).", 422);
  }

  const updated = await db.partnerRequest.update({ where: { id }, data });

  // Chronologie visible par le propriétaire + audit interne
  await db.incidentEvent.create({
    data: {
      incidentId: request.incidentId,
      type: "partner",
      label: eventLabel,
      detail: eventDetail,
      actorRole: active === "gsm" ? "partner" : active === "police" ? "partner" : "system",
    },
  });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: `backoffice.partner_request.${action}`, objectType: "partner_request", objectId: id,
    reason: `${request.incident.refNumber} — ${eventLabel}`,
  });

  return ok({
    request: {
      id: updated.id, partnerType: updated.partnerType, partnerName: updated.partnerName,
      requestType: updated.requestType, motive: updated.motive, status: updated.status,
      note: updated.note, responseNote: updated.responseNote,
      transmittedAt: updated.transmittedAt, processedAt: updated.processedAt,
      createdAt: updated.createdAt,
      incident: {
        id: request.incident.id, refNumber: request.incident.refNumber,
        type: request.incident.type, status: updated.status === "answered" ? request.incident.status : request.incident.status,
        owner: { fullName: "", phone: null },
        device: request.incident.device
          ? { deviceId: request.incident.device.deviceId, brand: request.incident.device.brand, model: request.incident.device.model }
          : null,
        identifiers: [],
      },
    },
    observation,
  });
}
