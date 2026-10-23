// GET /api/v1/backoffice/partner-requests?space=gsm|police|system — file des demandes
// GSM : demandes opérateurs (SIM, IMEI, localisation réseau).
// Police : demandes autorités (IMEI, vérifications).
// Système : vue consolidée.
import { db } from "@/lib/db";
import { ok, apiFail, requireBoSpace } from "@/lib/api";
import { maskIdentifier } from "@/lib/albatros";

export async function GET(req: Request) {
  const { user, space } = await requireBoSpace(new URL(req.url).searchParams.get("space") ?? "gsm");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);

  const partnerType = space === "gsm" ? "operator" : space === "police" ? "authority" : undefined;
  const requests = await db.partnerRequest.findMany({
    where: partnerType ? { partnerType } : undefined,
    orderBy: [{ status: "desc" }, { createdAt: "desc" }],
    take: 120,
    include: {
      incident: {
        include: {
          user: { select: { fullName: true, phone: true } },
          device: { select: { id: true, deviceId: true, brand: true, model: true } },
        },
      },
    },
  });

  // Identifiants vérifiés des appareils concernés — masqués côté back-office
  const deviceRowIds = [...new Set(requests.map((r) => r.incident.device?.id).filter(Boolean))] as string[];
  const identifiers = deviceRowIds.length
    ? await db.deviceIdentifier.findMany({
        where: { deviceId: { in: deviceRowIds }, verified: true },
        take: 300,
      })
    : [];

  return ok({
    requests: requests.map((r) => ({
      id: r.id,
      partnerType: r.partnerType,
      partnerName: r.partnerName,
      requestType: r.requestType,
      motive: r.motive,
      status: r.status,
      note: r.note,
      responseNote: r.responseNote,
      transmittedAt: r.transmittedAt,
      processedAt: r.processedAt,
      createdAt: r.createdAt,
      incident: {
        id: r.incident.id,
        refNumber: r.incident.refNumber,
        type: r.incident.type,
        status: r.incident.status,
        owner: { fullName: r.incident.user.fullName, phone: r.incident.user.phone },
        device: r.incident.device
          ? { deviceId: r.incident.device.deviceId, brand: r.incident.device.brand, model: r.incident.device.model }
          : null,
        identifiers: identifiers
          .filter((i) => i.deviceId === r.incident.device?.id)
          .slice(0, 3)
          .map((i) => ({ type: i.type, value: maskIdentifier(i.value) })),
      },
    })),
  });
}
