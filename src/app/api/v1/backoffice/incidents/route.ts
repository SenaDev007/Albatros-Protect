// GET /api/v1/backoffice/incidents?space=system|police — supervision des dossiers
// Système : tous les dossiers. Police : vols & dossiers avec plainte, focus enquête.
import { db } from "@/lib/db";
import { ok, apiFail, requireBoSpace } from "@/lib/api";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const { user, space } = await requireBoSpace(url.searchParams.get("space") ?? "system");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);
  if (space === "gsm") {
    return apiFail("FORBIDDEN", "La supervision des dossiers relève des espaces Système et Police.", 403);
  }

  const status = url.searchParams.get("status");
  const where: Prisma.IncidentWhereInput = {};
  if (status && status !== "all") where.status = status;
  if (space === "police") {
    // La police voit les vols et les dossiers liés à une plainte
    where.AND = [
      {
        OR: [{ type: "theft" }, { policeReportRef: { not: null } }],
      },
    ];
  }

  const incidents = await db.incident.findMany({
    where,
    orderBy: { declaredAt: "desc" },
    take: 100,
    include: {
      user: { select: { fullName: true, phone: true, email: true } },
      device: { select: { deviceId: true, brand: true, model: true } },
      _count: { select: { observations: true, partnerRequests: true } },
    },
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
      observationsCount: i._count.observations,
      owner: { fullName: i.user.fullName, phone: i.user.phone, email: i.user.email },
      device: i.device,
    })),
  });
}
