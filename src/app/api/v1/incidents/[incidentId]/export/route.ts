// GET /api/v1/incidents/{incidentId}/export — dossier exportable (F-064)
// JSON horodaté avec provenance de chaque élément. Document d'aide — pas un procès-verbal.
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, logAudit } from "@/lib/api";
import { maskIdentifier } from "@/lib/albatros";

export async function GET(_req: Request, { params }: { params: Promise<{ incidentId: string }> }) {
  const { incidentId } = await params;
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const incident = await db.incident.findFirst({
    where: { OR: [{ id: incidentId }, { refNumber: incidentId }], userId: user.id },
    include: { device: true },
  });
  if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);

  const [events, observations, partnerRequests, documents, identifiers] = await Promise.all([
    db.incidentEvent.findMany({ where: { incidentId: incident.id }, orderBy: { createdAt: "asc" } }),
    db.locationObservation.findMany({
      where: { incidentId: incident.id },
      orderBy: { capturedAt: "desc" },
    }),
    db.partnerRequest.findMany({ where: { incidentId: incident.id } }),
    db.documentEntity.findMany({ where: { OR: [{ incidentId: incident.id }, { deviceId: incident.deviceId }] } }),
    db.deviceIdentifier.findMany({ where: { deviceId: incident.deviceId } }),
  ]);

  const dossier = {
    generated_at: new Date().toISOString(),
    service: "Agent Albatros — pilote Parakou",
    disclaimer:
      "Récapitulatif établi à partir des déclarations du propriétaire. Ce document n'est pas un procès-verbal officiel et n'atteste pas par lui-même d'un vol. Les identifiants sont partiellement masqués dans l'export standard ; la présentation des originaux se fait dans le cadre des procédures officielles.",
    incident: {
      reference: incident.refNumber,
      type: incident.type === "theft" ? "Vol" : "Perte",
      statut: incident.status,
      date_des_faits: incident.occurredAt,
      declare_le: incident.declaredAt,
      lieu_declare: incident.locationText,
      description: incident.description,
      sim_concernee: incident.simPhone,
      reference_plainte: incident.policeReportRef,
      clotre_le: incident.closedAt,
      motif_cloture: incident.closeReason,
    },
    appareil: {
      identifiant_service: incident.device.deviceId,
      categorie: incident.device.category,
      marque: incident.device.brand,
      modele: incident.device.model,
      couleur: incident.device.color,
      systeme: `${incident.device.osName ?? ""} ${incident.device.osVersion ?? ""}`.trim() || null,
      identifiants: identifiers.map((i) => ({
        type: i.type,
        valeur_masquee: maskIdentifier(i.value),
        verifie: i.verified,
      })),
    },
    chronologie: events.map((e) => ({
      date: e.createdAt, type: e.type, libelle: e.label, detail: e.detail, acteur: e.actorRole,
    })),
    observations: observations.map((o) => ({
      source: o.source,
      heure_collecte: o.capturedAt,
      heure_reception: o.receivedAt,
      latitude: o.latitude,
      longitude: o.longitude,
      rayon_precision_m: o.accuracyRadiusM ?? "inconnue",
      qualite: o.quality,
      mode: o.mode,
      note: o.note,
    })),
    demandes_partenaires: partnerRequests.map((p) => ({
      partenaire: p.partnerName, type: p.requestType, statut: p.status,
      note: p.note,
    })),
    pieces: documents.map((d) => ({
      nom: d.name, type: d.type, depose_le: d.uploadedAt, conservation_jusqu_a: d.expiresAt,
    })),
  };

  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "incident.export", objectType: "incident", objectId: incident.id,
  });
  return ok(dossier);
}
