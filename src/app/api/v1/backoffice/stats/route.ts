// GET /api/v1/backoffice/stats?space=system|gsm|police — indicateurs par espace
import { db } from "@/lib/db";
import { ok, apiFail, requireBoSpace, logAudit } from "@/lib/api";

export async function GET(req: Request) {
  const { user, space } = await requireBoSpace(new URL(req.url).searchParams.get("space") ?? "");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);

  const since24h = new Date(Date.now() - 24 * 3600 * 1000);

  if (space === "system") {
    const [users, devices, incidentsOpen, observations24h, sessions, privacyPending, partnerPending, audits24h] =
      await Promise.all([
        db.user.count(),
        db.device.count({ where: { status: "active" } }),
        db.incident.count({ where: { status: { notIn: ["closed", "draft"] } } }),
        db.locationObservation.count({ where: { receivedAt: { gte: since24h } } }),
        db.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
        db.privacyRequest.count({ where: { status: { not: "done" } } }),
        db.partnerRequest.count({ where: { status: { in: ["transmitted", "draft"] } } }),
        db.auditEvent.count({ where: { createdAt: { gte: since24h } } }),
      ]);
    await logAudit({
      actorId: user.id, actorRole: user.role,
      action: "backoffice.stats.view", objectType: "backoffice", objectId: space,
    });
    return ok({
      space,
      kpis: [
        { key: "users", label: "Comptes utilisateurs", value: users, hint: "tous rôles confondus" },
        { key: "devices", label: "Appareils actifs", value: devices, hint: "statut actif" },
        { key: "incidents", label: "Dossiers ouverts", value: incidentsOpen, hint: "hors clôturés/brouillons", tone: incidentsOpen > 0 ? "warn" : "ok" },
        { key: "obs24", label: "Observations (24 h)", value: observations24h, hint: "toutes sources" },
        { key: "sessions", label: "Sessions actives", value: sessions },
        { key: "partner", label: "Demandes partenaires en cours", value: partnerPending, hint: "transmises / brouillons", tone: partnerPending > 0 ? "warn" : "ok" },
        { key: "privacy", label: "Demandes RGPD en attente", value: privacyPending, tone: privacyPending > 0 ? "warn" : "ok" },
        { key: "audit24", label: "Événements d'audit (24 h)", value: audits24h },
      ],
    });
  }

  if (space === "gsm") {
    const byStatus = await db.partnerRequest.groupBy({ by: ["status"], _count: true, where: { partnerType: "operator" } });
    const byType = await db.partnerRequest.groupBy({ by: ["requestType"], _count: true, where: { partnerType: "operator", status: { in: ["transmitted", "draft"] } } });
    const get = (s: string) => byStatus.find((x) => x.status === s)?._count ?? 0;
    const netLoc = byType.find((x) => x.requestType === "network_location")?._count ?? 0;
    const sim = byType.find((x) => x.requestType === "sim_suspension")?._count ?? 0;
    const imei = byType.find((x) => x.requestType === "imei_block")?._count ?? 0;
    const answered = get("answered");
    const transmitted = get("transmitted");
    await logAudit({
      actorId: user.id, actorRole: user.role,
      action: "backoffice.stats.view", objectType: "backoffice", objectId: space,
    });
    return ok({
      space,
      kpis: [
        { key: "transmitted", label: "Demandes à traiter", value: transmitted, hint: "transmises à l'opérateur", tone: transmitted > 0 ? "warn" : "ok" },
        { key: "answered", label: "Demandes traitées", value: answered, hint: "réponses formulées", tone: "ok" },
        { key: "sim", label: "Suspensions SIM en cours", value: sim },
        { key: "imei", label: "Blocages IMEI en cours", value: imei },
        { key: "netloc", label: "Localisations réseau en cours", value: netLoc, hint: "triangulation autorisée" },
        { key: "refused", label: "Demandes refusées", value: get("refused") },
      ],
    });
  }

  // space === "police"
  const [thefts, withReport, readyToTransmit, authorityPending, closedMonth] = await Promise.all([
    db.incident.count({ where: { type: "theft", status: { notIn: ["closed", "draft"] } } }),
    db.incident.count({ where: { policeReportRef: { not: null }, status: { notIn: ["closed"] } } }),
    db.incident.count({ where: { status: "ready_to_transmit" } }),
    db.partnerRequest.count({ where: { partnerType: "authority", status: { in: ["transmitted", "draft"] } } }),
    db.incident.count({ where: { status: "closed", closedAt: { gte: new Date(Date.now() - 30 * 24 * 3600 * 1000) } } }),
  ]);
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "backoffice.stats.view", objectType: "backoffice", objectId: space,
  });
  return ok({
    space,
    kpis: [
      { key: "thefts", label: "Vols en cours", value: thefts, tone: thefts > 0 ? "warn" : "ok" },
      { key: "reports", label: "Dossiers avec plainte", value: withReport, hint: "référence enregistrée" },
      { key: "ready", label: "Dossiers prêts à transmettre", value: readyToTransmit, hint: "vérification complète", tone: readyToTransmit > 0 ? "warn" : "ok" },
      { key: "authority", label: "Demandes autorités en cours", value: authorityPending },
      { key: "closed", label: "Dossiers clôturés (30 j)", value: closedMonth, tone: "ok" },
    ],
  });
}
