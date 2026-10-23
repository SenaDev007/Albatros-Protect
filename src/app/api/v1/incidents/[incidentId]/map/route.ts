// GET /api/v1/incidents/{incidentId}/map — observations autorisées pour la carte
// Accès renforcé : propriétaire vérifié uniquement ; pas d'accès général support (§8.4, §19.4)
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, logAudit } from "@/lib/api";
import { OBSERVATION_SOURCES } from "@/lib/albatros";

export async function GET(req: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const incident = await db.incident.findFirst({
    where: { OR: [{ id: incidentId }, { refNumber: incidentId }], userId: user.id },
  });
  if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);

  const url = new URL(req.url);
  const sources = url.searchParams.getAll("source");
  const since = url.searchParams.get("since_hours");

  const where: Record<string, unknown> = {
    OR: [{ incidentId: incident.id }, { deviceId: incident.deviceId }],
  };
  if (sources.length) where.source = { in: sources };
  if (since) {
    where.capturedAt = { gte: new Date(Date.now() - Number(since) * 3600 * 1000) };
  }

  const observations = await db.locationObservation.findMany({
    where,
    orderBy: { capturedAt: "desc" },
    take: 200,
  });

  const bleEncounters = await db.bleEncounter.findMany({
    where: { targetDeviceId: incident.deviceId },
    orderBy: { detectedAt: "desc" },
    take: 20,
  });

  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "map.view", objectType: "incident", objectId: incident.id,
    reason: "Consultation cartographique (accès renforcé)",
  });

  return ok({
    incident,
    observations,
    ble_encounters: bleEncounters.map((e) => ({
      ...e,
      tempIdentifier: undefined, // identifiant rotatif jamais exposé à l'UI (§11.2)
    })),
    legend: Object.entries(OBSERVATION_SOURCES).map(([key, v]) => ({
      source: key, label: v.label, color: v.color, description: v.description,
    })),
    honesty: {
      disclaimer:
        "Aucune position n'est fabriquée. Chaque point affiche sa source, son heure et sa précision estimée. Une détection Bluetooth montre la position du téléphone détecteur, pas un GPS de l'appareil.",
      fusion_note:
        "Les sources discordantes sont affichées séparément (pas de point fusionné artificiel).",
    },
  });
}
