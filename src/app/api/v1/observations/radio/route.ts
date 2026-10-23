// POST /api/v1/observations/radio — observations Wi-Fi/cellulaires minimales vers l'adaptateur
// Google Maps Platform Geolocation API (§7). En production : appel réel via la clé du backend.
// Au pilote : adaptation simulée, avec coupe-circuit de quota et purge des entrées brutes.
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

// Compteur mémoire (pilotage du quota journalier — coupe-circuit §7.4)
const globalQuota = globalThis as unknown as { __albatrosGeoCalls?: { date: string; count: number } };
const DAILY_QUOTA = 40;

const COTONOU = { lat: 9.3433, lng: 2.6089 };
const jitter = (v: number, d: number) => v + (Math.random() - 0.5) * d;

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{
    device_id?: string;
    incident_id?: string;
    wifi_points?: number;
    cell_towers?: number;
    captured_at?: string;
  }>(req);

  const wifi = Math.max(0, Math.min(50, body.wifi_points ?? 0));
  const cell = Math.max(0, Math.min(50, body.cell_towers ?? 0));

  if (!body.device_id) return apiFail("VALIDATION_ERROR", "Appareil requis.", 422);
  const device = await db.device.findFirst({
    where: { OR: [{ id: body.device_id }, { deviceId: body.device_id }], ownerId: user.id },
  });
  if (!device) return apiFail("NOT_FOUND", "Appareil introuvable.", 404);
  if (!device.enrolled) return apiFail("DEVICE_NOT_ENROLLED", "Appareil non enrôlé.", 409);

  // Aucun appel n'est fabriqué sans entrées valides et fraîches (§7.1)
  if (wifi + cell < 2) {
    return apiFail("RADIO_INPUT_UNAVAILABLE",
      "Observations Wi-Fi/cellulaires insuffisantes : aucun appel au fournisseur de localisation.", 422);
  }

  // Coupe-circuit de quota (démo du comportement production)
  const today = new Date().toISOString().slice(0, 10);
  const q = globalQuota.__albatrosGeoCalls ?? { date: today, count: 0 };
  if (q.date !== today) { q.date = today; q.count = 0; }
  if (q.count >= DAILY_QUOTA) {
    return apiFail("GOOGLE_QUOTA_EXCEEDED",
      "Quota journalier du fournisseur atteint : estimation indisponible sans surfacturation.", 429);
  }
  q.count++;
  globalQuota.__albatrosGeoCalls = q;

  const capturedAt = body.captured_at ? new Date(body.captured_at) : new Date();

  // RadioObservation : trace minimale, purge immédiate après traitement (§5.3, §7.2)
  const radio = await db.radioObservation.create({
    data: {
      deviceId: device.id,
      payloadSummary: `${wifi} point(s) Wi-Fi, ${cell} antenne(s) — valeurs brutes non conservées`,
      consented: true,
      capturedAt,
      processedAt: new Date(),
      purgedAt: new Date(),
      ttlExpiresAt: new Date(Date.now() + 60000),
    },
  });

  // Réponse du fournisseur (simulée au pilote) : latitude/longitude + rayon d'incertitude
  const last = await db.locationObservation.findFirst({
    where: { deviceId: device.id },
    orderBy: { capturedAt: "desc" },
  });
  const base = last ? { lat: last.latitude, lng: last.longitude } : COTONOU;
  const radius = Math.round(80 + Math.random() * 240);

  let incidentId = body.incident_id ?? null;
  if (!incidentId) {
    const active = await db.incident.findFirst({
      where: { deviceId: device.id, status: { notIn: ["closed", "draft"] } },
      orderBy: { declaredAt: "desc" },
    });
    incidentId = active?.id ?? null;
  }

  const observation = await db.locationObservation.create({
    data: {
      deviceId: device.id,
      incidentId,
      source: "google_geolocation",
      latitude: jitter(base.lat, 0.004),
      longitude: jitter(base.lng, 0.004),
      accuracyRadiusM: radius,
      capturedAt: new Date(),
      receivedAt: new Date(),
      mode: incidentId ? "incident" : "normal",
      quality: "approximate",
      radioObsId: radio.id,
      note: `Estimation Wi-Fi/cellulaire — rayon ${radius} m. Entrées brutes purgées après traitement.`,
    },
  });

  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "observation.radio_geolocation", objectType: "device", objectId: device.id,
    reason: `Adaptateur Google Geolocation appelé (${wifi} Wi-Fi, ${cell} cell) — simulation pilote`,
  });
  return ok({
    observation,
    radio_trace: { id: radio.id, purged: true, kept_summary: radio.payloadSummary },
    provider_note:
      "Pilote : réponse simulée côté serveur. En production, la clé Geolocation API reste côté backend, jamais embarquée dans un client.",
    quota_remaining_today: Math.max(0, DAILY_QUOTA - q.count),
  }, 201);
}
