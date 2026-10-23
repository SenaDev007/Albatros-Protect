// GET /api/v1/console/stats — indicateurs du pilote (CDC §5.2)
// Aucun indicateur n'incite à élargir la collecte au-delà du nécessaire.
import { db } from "@/lib/db";
import { requireStaff, ok, apiFail } from "@/lib/api";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return apiFail("FORBIDDEN", "Accès réservé au personnel habilité.", 403);

  const [users, devices, incidents, observations, bleEncounters, closed, retrieved, consents, privacy] =
    await Promise.all([
      db.user.count(),
      db.device.count({ where: { status: "active" } }),
      db.incident.findMany({ select: { status: true, type: true } }),
      db.locationObservation.findMany({ select: { source: true, quality: true } }),
      db.bleEncounter.count(),
      db.incident.count({ where: { status: "closed" } }),
      db.incident.count({ where: { status: "closed", closeReason: { contains: "retrouvé" } } }),
      db.consentRecord.findMany({ select: { purpose: true, granted: true } }),
      db.privacyRequest.count(),
    ]);

  const byStatus: Record<string, number> = {};
  for (const i of incidents) byStatus[i.status] = (byStatus[i.status] ?? 0) + 1;
  const bySource: Record<string, number> = {};
  for (const o of observations) bySource[o.source] = (bySource[o.source] ?? 0) + 1;
  const consentsByPurpose: Record<string, { granted: number; revoked: number }> = {};
  for (const c of consents) {
    const k = c.purpose;
    consentsByPurpose[k] ??= { granted: 0, revoked: 0 };
    if (c.granted) consentsByPurpose[k].granted++; else consentsByPurpose[k].revoked++;
  }

  return ok({
    totals: {
      users,
      active_devices: devices,
      incidents: incidents.length,
      open_incidents: incidents.filter((i) => !["closed", "draft"].includes(i.status)).length,
      closed_incidents: closed,
      retrieved_devices: retrieved,
      ble_encounters: bleEncounters,
      privacy_requests: privacy,
    },
    incidents_by_status: byStatus,
    observations_by_source: bySource,
    consents_by_purpose: consentsByPurpose,
    note:
      "Indicateurs de pilotage uniquement (§5.2). Valeurs-cibles à définir après étude de référence et accord des partenaires.",
  });
}
