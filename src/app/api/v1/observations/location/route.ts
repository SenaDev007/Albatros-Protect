// POST /api/v1/observations/location — ingestion d'une observation de localisation
// Chaque observation conserve sa source, son heure de collecte et sa précision (§5.2, F-031)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

const VALID_SOURCES = ["native_location", "google_geolocation", "ble_witness", "operator_authorized"];

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{
    device_id?: string;
    incident_id?: string;
    source?: string;
    latitude?: number;
    longitude?: number;
    accuracy_radius_m?: number | null;
    captured_at?: string;
    mode?: string;
    quality?: string;
    note?: string;
    idempotency_key?: string;
  }>(req);

  if (!body.device_id || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return apiFail("VALIDATION_ERROR", "Appareil et coordonnées requis.", 422);
  }
  if (!body.source || !VALID_SOURCES.includes(body.source)) {
    return apiFail("VALIDATION_ERROR", "Source inconnue.", 422);
  }
  const device = await db.device.findFirst({
    where: { OR: [{ id: body.device_id }, { deviceId: body.device_id }], ownerId: user.id },
  });
  if (!device) return apiFail("NOT_FOUND", "Appareil introuvable.", 404);
  if (!device.enrolled) {
    return apiFail("DEVICE_NOT_ENROLLED",
      "L'appareil n'est pas enrôlé : aucune application/agent ne peut transmettre.", 409);
  }

  let incidentId = body.incident_id ?? null;
  if (incidentId) {
    const incident = await db.incident.findFirst({
      where: { id: incidentId, userId: user.id, deviceId: device.id },
    });
    if (!incident) return apiFail("NOT_FOUND", "Dossier non lié à cet appareil.", 404);
    if (incident.status === "closed") {
      return apiFail("VALIDATION_ERROR", "Dossier clôturé : plus de collecte d'incident.", 409);
    }
  }

  // Idempotence par clé de requête (§6.2)
  if (body.idempotency_key) {
    const dup = await db.locationObservation.findFirst({
      where: { deviceId: device.id, note: `idem:${body.idempotency_key}` },
    });
    if (dup) return ok({ observation: dup, idempotent_replay: true });
  }

  const capturedAt = body.captured_at ? new Date(body.captured_at) : new Date();
  const observation = await db.locationObservation.create({
    data: {
      deviceId: device.id,
      incidentId,
      source: body.source,
      latitude: body.latitude,
      longitude: body.longitude,
      // Précision : uniquement si fournie — jamais fabriquée (F-032)
      accuracyRadiusM:
        typeof body.accuracy_radius_m === "number" ? body.accuracy_radius_m : null,
      capturedAt,
      receivedAt: new Date(),
      mode: body.mode === "incident" ? "incident" : "normal",
      quality: body.quality ?? "estimated",
      note: body.idempotency_key ? `idem:${body.idempotency_key}` : body.note ?? null,
    },
  });
  await db.device.update({
    where: { id: device.id },
    data: { lastTransmissionAt: new Date() },
  });
  if (incidentId) {
    await db.incidentEvent.create({
      data: {
        incidentId,
        type: "observation",
        label: "Nouvelle observation reçue",
        detail: `Source : ${body.source}`,
        actorRole: "system",
      },
    });
  }
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "observation.location_ingest", objectType: "device", objectId: device.id,
  });
  return ok({ observation }, 201);
}
