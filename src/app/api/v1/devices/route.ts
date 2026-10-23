// GET /api/v1/devices — inventaire du propriétaire
// POST /api/v1/devices — ajout d'appareil (F-010/F-011/F-015)
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { genDeviceId } from "@/lib/albatros";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const devices = await db.device.findMany({
    where: { ownerId: user.id, status: { not: "removed" } },
    orderBy: { createdAt: "desc" },
    include: { identifiers: true },
  });
  const obs = await db.locationObservation.findMany({
    where: { deviceId: { in: devices.map((d) => d.id) } },
    orderBy: { capturedAt: "desc" },
    take: 80,
  });
  const lastByDevice = new Map<string, (typeof obs)[number]>();
  for (const o of obs) if (!lastByDevice.has(o.deviceId)) lastByDevice.set(o.deviceId, o);
  const openIncidents = await db.incident.findMany({
    where: { userId: user.id, status: { notIn: ["closed", "draft"] } },
  });
  return ok({
    devices: devices.map((d) => ({
      ...d,
      identifiers: undefined,
      identifiersCount: d.identifiers.length,
      lastObservation: lastByDevice.get(d.id) ?? null,
      openIncident: openIncidents.find((i) => i.deviceId === d.id) ?? null,
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{
    category?: string;
    brand?: string;
    model?: string;
    color?: string;
    os_name?: string;
    os_version?: string;
    identifiers?: { type: string; value: string }[];
  }>(req);
  const category = body.category ?? "";
  const brand = (body.brand ?? "").trim();
  const model = (body.model ?? "").trim();
  if (!["smartphone", "tablet", "laptop", "desktop"].includes(category) || !brand || !model) {
    return apiFail("VALIDATION_ERROR", "Catégorie, marque et modèle sont obligatoires.", 422);
  }
  const device = await db.device.create({
    data: {
      deviceId: genDeviceId(),
      ownerId: user.id,
      category,
      brand,
      model,
      color: body.color?.trim() || null,
      osName: body.os_name?.trim() || null,
      osVersion: body.os_version?.trim() || null,
    },
  });
  const idents = (body.identifiers ?? []).filter((i) => i.value?.trim());
  if (idents.length) {
    await db.deviceIdentifier.createMany({
      data: idents.map((i) => ({
        deviceId: device.id,
        type: ["imei", "serial", "purchase_ref"].includes(i.type) ? i.type : "declared",
        value: i.value.trim(),
        valueHmac: `hmac_${device.id}_${i.type}`,
      })),
    });
    await db.device.update({
      where: { id: device.id },
      data: { identifiersComplete: true },
    });
  }
  await logAudit({
    actorId: user.id,
    actorRole: user.role,
    action: "device.create",
    objectType: "device",
    objectId: device.id,
  });
  return ok({ device }, 201);
}
