// GET /api/v1/console/incidents — vue console opérationnelle (§4.4)
// Support : statuts et métadonnées, sans accès aux cartes précises par défaut.
import { db } from "@/lib/db";
import { requireStaff, ok, apiFail } from "@/lib/api";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return apiFail("FORBIDDEN", "Accès réservé au personnel habilité.", 403);
  const incidents = await db.incident.findMany({
    orderBy: { declaredAt: "desc" },
    take: 100,
    include: {
      device: { select: { brand: true, model: true, category: true, deviceId: true } },
      user: { select: { fullName: true, phone: true, email: true } },
      partnerRequests: true,
      _count: { select: { events: true, observations: true } },
    },
  });
  const privacyRequests = await db.privacyRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { user: { select: { fullName: true } } },
  });
  return ok({
    incidents: incidents.map((i) => ({
      id: i.id,
      refNumber: i.refNumber,
      type: i.type,
      status: i.status,
      occurredAt: i.occurredAt,
      declaredAt: i.declaredAt,
      locationText: i.locationText,
      policeReportRef: i.policeReportRef,
      closedAt: i.closedAt,
      closeReason: i.closeReason,
      device: i.device,
      owner: i.user,
      partnerRequests: i.partnerRequests,
      eventsCount: i._count.events,
      // Support : aucune coordonnée précise n'est exposée ici (§6.4, §13.2)
      observationsCount: i._count.observations,
    })),
    privacyRequests,
    support_view_notice:
      "Vue support : statuts et métadonnées seulement. Les positions détaillées exigent une finalité précise, une habilitation et restent journalisées.",
  });
}
