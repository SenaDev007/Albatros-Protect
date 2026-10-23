// POST /api/v1/backoffice/triangulation — localisation réseau autorisée (espace GSM)
// Calcule une position par triangulation (moteur Gauss-Newton) autour de la
// dernière position connue de l'appareil d'un dossier. persist=true enregistre
// une observation « partenaire autorisé » visible par le propriétaire.
import { db } from "@/lib/db";
import { ok, apiFail, parseBody, logAudit, requireBoSpace } from "@/lib/api";
import { runTriangulation } from "@/lib/geo";

export async function POST(req: Request) {
  const { user, space } = await requireBoSpace("gsm");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "La localisation réseau relève de l'espace GSM.", 403);

  const body = await parseBody<{ incident_id?: string; persist?: boolean }>(req);
  if (!body.incident_id) return apiFail("VALIDATION_ERROR", "Dossier requis.", 422);

  const incident = await db.incident.findUnique({
    where: { id: body.incident_id },
    include: { device: true },
  });
  if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);
  if (incident.status === "closed") {
    return apiFail("VALIDATION_ERROR", "Dossier clôturé : plus de localisation réseau.", 409);
  }

  const last = await db.locationObservation.findFirst({
    where: { deviceId: incident.deviceId },
    orderBy: { capturedAt: "desc" },
  });
  const reference =
    last ? { lat: last.latitude, lng: last.longitude }
    : incident.latitude != null && incident.longitude != null
      ? { lat: incident.latitude, lng: incident.longitude }
      : { lat: 9.3433, lng: 2.6089 };

  const tri = runTriangulation(reference, 4, 4);
  let observation: unknown = null;

  if (body.persist) {
    const now = new Date();
    observation = await db.locationObservation.create({
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
        note: `Position communiquée par ${user.organization ?? "l'opérateur"} — localisation réseau légale (triangulation ${tri.anchors.length} ancres, résidu RMS ${tri.residualRmsM} m).`,
      },
    });
    await db.incidentEvent.create({
      data: {
        incidentId: incident.id,
        type: "observation",
        label: "Position réseau communiquée par l'opérateur",
        detail: `Localisation autorisée — ±${Math.round(tri.accuracyRadiusM)} m, ${tri.anchors.length} ancres.`,
        actorRole: "partner",
      },
    });
    await logAudit({
      actorId: user.id, actorRole: user.role,
      action: "backoffice.triangulation.persist", objectType: "incident", objectId: incident.id,
      reason: `${incident.refNumber} — localisation réseau ±${Math.round(tri.accuracyRadiusM)} m`,
    });
  } else {
    await logAudit({
      actorId: user.id, actorRole: user.role,
      action: "backoffice.triangulation.preview", objectType: "incident", objectId: incident.id,
      reason: `${incident.refNumber} — aperçu sans enregistrement`,
    });
  }

  return ok({
    triangulation: {
      anchors: tri.anchors.map((a) => ({
        id: a.id, kind: a.kind, label: a.label, lat: a.lat, lng: a.lng, rssi: a.rssi, distance_m: a.distanceM,
      })),
      center: { lat: tri.point.lat, lng: tri.point.lng },
      accuracy_radius_m: Math.round(tri.accuracyRadiusM),
      residual_rms_m: tri.residualRmsM,
      iterations: tri.iterations,
      converged: tri.converged,
      method: tri.method,
    },
    observation,
  });
}
