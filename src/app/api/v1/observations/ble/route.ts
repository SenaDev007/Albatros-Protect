// POST /api/v1/observations/ble — relais d'une rencontre BLE du réseau communautaire
// §11 : identifiant rotatif, position du détecteur, jamais l'identité du propriétaire.
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";
import { randomBytes } from "crypto";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{
    device_id?: string; // appareil cible détecté
    rssi?: number;
    detector_latitude?: number;
    detector_longitude?: number;
    detector_accuracy_m?: number;
    captured_at?: string;
    incident_id?: string;
  }>(req);

  if (!body.device_id || typeof body.detector_latitude !== "number" || typeof body.detector_longitude !== "number") {
    return apiFail("VALIDATION_ERROR", "Appareil cible et position du détecteur requis.", 422);
  }
  const device = await db.device.findFirst({
    where: { OR: [{ id: body.device_id }, { deviceId: body.device_id }] },
  });
  if (!device) return apiFail("NOT_FOUND", "Appareil cible introuvable.", 404);
  if (!device.bleEnabled) {
    return apiFail("CONSENT_REVOKED",
      "La cible ne participe pas au réseau de détection (participation désactivée).", 409);
  }

  const activeIncident = await db.incident.findFirst({
    where: { deviceId: device.id, status: { notIn: ["closed", "draft"] } },
    orderBy: { declaredAt: "desc" },
  });
  const capturedAt = body.captured_at ? new Date(body.captured_at) : new Date();

  const encounter = await db.bleEncounter.create({
    data: {
      targetDeviceId: device.id,
      tempIdentifier: `tmp-${randomBytes(4).toString("hex")}-rot`, // identifiant rotatif, non dérivable du compte
      rssi: typeof body.rssi === "number" ? Math.round(body.rssi) : null,
      detectedAt: capturedAt,
      detectorPositionLat: body.detector_latitude,
      detectorPositionLng: body.detector_longitude,
      detectorAccuracyM: typeof body.detector_accuracy_m === "number" ? body.detector_accuracy_m : null,
      validated: true,
      transmissionStatus: "delivered",
    },
  });
  const observation = await db.locationObservation.create({
    data: {
      deviceId: device.id,
      incidentId: activeIncident?.id ?? body.incident_id ?? null,
      source: "ble_witness",
      latitude: body.detector_latitude,
      longitude: body.detector_longitude,
      accuracyRadiusM: typeof body.detector_accuracy_m === "number" ? body.detector_accuracy_m : null,
      capturedAt,
      receivedAt: new Date(),
      mode: activeIncident ? "incident" : "normal",
      quality: "approximate",
      bleEncounterId: encounter.id,
      note: "Détection Bluetooth : position du téléphone détecteur, pas un GPS de l'appareil recherché.",
    },
  });
  if (activeIncident) {
    await db.incidentEvent.create({
      data: {
        incidentId: activeIncident.id,
        type: "observation",
        label: "Détection Bluetooth communautaire",
        detail: "Un téléphone participant a détecté l'appareil à proximité (position du détecteur).",
        actorRole: "system",
      },
    });
  }
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "observation.ble_relay", objectType: "device", objectId: device.id,
    reason: "Relais d'une rencontre BLE validée",
  });
  return ok({ encounter, observation }, 201);
}
