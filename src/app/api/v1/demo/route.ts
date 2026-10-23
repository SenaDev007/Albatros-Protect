// POST /api/v1/demo — simulateur de démonstration (clairement étiqueté, données fictives)
// Utilisé pour montrer les flux d'observation sans application mobile installée.
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";
import { randomBytes } from "crypto";

const COTONOU = { lat: 6.3654, lng: 2.3966 };
const jitter = (v: number, d: number) => v + (Math.random() - 0.5) * d;

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{ action?: string; device_id?: string; incident_id?: string }>(req);
  if (!body.action || !body.device_id) {
    return apiFail("VALIDATION_ERROR", "Action et appareil requis.", 422);
  }
  const device = await db.device.findFirst({
    where: { OR: [{ id: body.device_id }, { deviceId: body.device_id }], ownerId: user.id },
  });
  if (!device) return apiFail("NOT_FOUND", "Appareil introuvable.", 404);

  const activeIncident =
    (await db.incident.findFirst({
      where: { deviceId: device.id, status: { notIn: ["closed", "draft"] } },
      orderBy: { declaredAt: "desc" },
    })) ?? null;
  const incidentId = body.incident_id ?? activeIncident?.id ?? null;
  const now = new Date();

  if (body.action === "native_position") {
    if (!device.enrolled) {
      return apiFail("DEVICE_NOT_ENROLLED", "Appareil non enrôlé : enrôlez-le d'abord (Préparation).", 409);
    }
    const observation = await db.locationObservation.create({
      data: {
        deviceId: device.id,
        incidentId,
        source: "native_location",
        latitude: jitter(COTONOU.lat, 0.02),
        longitude: jitter(COTONOU.lng, 0.02),
        accuracyRadiusM: Math.round(20 + Math.random() * 60),
        capturedAt: now,
        receivedAt: now,
        mode: incidentId ? "incident" : "normal",
        quality: "estimated",
        note: "Position simulée (démo) — transmise par l'application/agent fictif.",
      },
    });
    await db.device.update({ where: { id: device.id }, data: { lastTransmissionAt: now } });
    if (incidentId) {
      await db.incidentEvent.create({
        data: { incidentId, type: "observation", label: "Observation simulée (démo)", detail: "Source : position native", actorRole: "system" },
      });
    }
    await logAudit({ actorId: user.id, actorRole: user.role, action: "demo.simulate", objectType: "device", objectId: device.id, reason: "native_position" });
    return ok({ observation, demo: true }, 201);
  }

  if (body.action === "ble_detection") {
    if (!device.bleEnabled) {
      return apiFail("CONSENT_REVOKED", "Participation BLE désactivée pour cet appareil.", 409);
    }
    const detectorLat = jitter(COTONOU.lat, 0.03);
    const detectorLng = jitter(COTONOU.lng, 0.03);
    const encounter = await db.bleEncounter.create({
      data: {
        targetDeviceId: device.id,
        tempIdentifier: `tmp-${randomBytes(4).toString("hex")}-rot`,
        rssi: -Math.round(45 + Math.random() * 40),
        detectedAt: now,
        detectorPositionLat: detectorLat,
        detectorPositionLng: detectorLng,
        detectorAccuracyM: Math.round(80 + Math.random() * 120),
        validated: true,
        transmissionStatus: "delivered",
      },
    });
    const observation = await db.locationObservation.create({
      data: {
        deviceId: device.id,
        incidentId,
        source: "ble_witness",
        latitude: detectorLat,
        longitude: detectorLng,
        accuracyRadiusM: encounter.detectorAccuracyM,
        capturedAt: now,
        receivedAt: now,
        mode: incidentId ? "incident" : "normal",
        quality: "approximate",
        bleEncounterId: encounter.id,
        note: "Détection simulée (démo) — position du téléphone détecteur.",
      },
    });
    await logAudit({ actorId: user.id, actorRole: user.role, action: "demo.simulate", objectType: "device", objectId: device.id, reason: "ble_detection" });
    return ok({ observation, encounter, demo: true }, 201);
  }

  if (body.action === "unreachable") {
    // Simule l'arrêt des transmissions : l'appareil devient "non joignable" (F-025)
    const staleTime = new Date(now.getTime() - 3 * 3600 * 1000);
    await db.device.update({ where: { id: device.id }, data: { lastTransmissionAt: staleTime } });
    await logAudit({ actorId: user.id, actorRole: user.role, action: "demo.simulate", objectType: "device", objectId: device.id, reason: "unreachable" });
    return ok({
      unreachable: true,
      last_seen: staleTime,
      message:
        "Transmission interrompue (simulation). L'état affiché est « non joignable depuis… » — sans conclusion automatique de vol ni d'extinction (F-025).",
    });
  }

  return apiFail("VALIDATION_ERROR", "Action inconnue (native_position | ble_detection | unreachable).", 422);
}
