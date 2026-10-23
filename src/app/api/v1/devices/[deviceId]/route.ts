// GET/PATCH/DELETE /api/v1/devices/{deviceId}
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

async function ctx(params: Promise<{ deviceId: string }>) {
  const { deviceId } = await params;
  const user = await requireUser();
  if (!user) return { user: null, device: null, deviceId };
  const device = await db.device.findFirst({
    where: { OR: [{ id: deviceId }, { deviceId: deviceId }], ownerId: user.id },
  });
  return { user, device, deviceId };
}

export async function GET(_req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { user, device } = await ctx(params);
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!device) return apiFail("NOT_FOUND", "Appareil introuvable.", 404);
  const [identifiers, consents, observations, incidents, documents] = await Promise.all([
    db.deviceIdentifier.findMany({ where: { deviceId: device.id } }),
    db.consentRecord.findMany({ where: { deviceId: device.id }, orderBy: { grantedAt: "desc" } }),
    db.locationObservation.findMany({
      where: { deviceId: device.id },
      orderBy: { capturedAt: "desc" },
      take: 20,
    }),
    db.incident.findMany({
      where: { deviceId: device.id },
      orderBy: { declaredAt: "desc" },
    }),
    db.documentEntity.findMany({ where: { deviceId: device.id } }),
  ]);
  return ok({ device, identifiers, consents, observations, incidents, documents });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { user, device } = await ctx(params);
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!device) return apiFail("NOT_FOUND", "Appareil introuvable.", 404);
  const body = await parseBody<{
    brand?: string; model?: string; color?: string; os_name?: string; os_version?: string;
    location_enabled?: boolean; ble_enabled?: boolean; notifications_enabled?: boolean;
    battery_optimized?: boolean; proof_uploaded?: boolean;
  }>(req);

  const toggles: Record<string, { field: string; purpose: string; permission: string }> = {
    location_enabled: { field: "locationEnabled", purpose: "location", permission: "transmission_de_position" },
    ble_enabled: { field: "bleEnabled", purpose: "ble_detection", permission: "participation_reseau_detection" },
  };

  const data: Record<string, unknown> = {};
  if (body.brand) data.brand = body.brand.trim();
  if (body.model) data.model = body.model.trim();
  if (body.color !== undefined) data.color = body.color;
  if (body.os_name) data.osName = body.os_name;
  if (body.os_version) data.osVersion = body.os_version;
  if (body.proof_uploaded !== undefined) data.proofUploaded = !!body.proof_uploaded;

  // Bascules de capacité — créent/révoquent les consentements correspondants (F-024)
  for (const [key, cfg] of Object.entries(toggles)) {
    const v = body[key as keyof typeof body];
    if (v === undefined) continue;
    const enabled = !!v;
    if ((device as unknown as Record<string, boolean>)[cfg.field] === enabled) continue;
    data[cfg.field] = enabled;
    const existing = await db.consentRecord.findFirst({
      where: { userId: user.id, deviceId: device.id, purpose: cfg.purpose, revokedAt: null },
    });
    if (enabled && !existing) {
      await db.consentRecord.create({
        data: { userId: user.id, deviceId: device.id, purpose: cfg.purpose, permission: cfg.permission, textVersion: "v1.1" },
      });
    } else if (!enabled && existing) {
      await db.consentRecord.update({
        where: { id: existing.id },
        data: { revokedAt: new Date(), granted: false },
      });
    }
    await logAudit({
      actorId: user.id, actorRole: user.role,
      action: enabled ? "consent.grant" : "consent.revoke",
      objectType: "device", objectId: device.id,
      reason: `${cfg.purpose} ${enabled ? "activé" : "désactivé"} par le propriétaire`,
    });
  }
  if (body.notifications_enabled !== undefined) data.notificationsEnabled = !!body.notifications_enabled;
  if (body.battery_optimized !== undefined) data.batteryOptimized = !!body.battery_optimized;

  const updated = await db.device.update({ where: { id: device.id }, data });
  return ok({ device: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { user, device } = await ctx(params);
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!device) return apiFail("NOT_FOUND", "Appareil introuvable.", 404);
  // Retrait souple : l'appareil quitte l'inventaire actif (F-014), l'historique reste auditable
  await db.device.update({ where: { id: device.id }, data: { status: "removed", enrolled: false, locationEnabled: false, bleEnabled: false } });
  await db.consentRecord.updateMany({
    where: { deviceId: device.id, revokedAt: null },
    data: { revokedAt: new Date(), granted: false },
  });
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "device.remove", objectType: "device", objectId: device.id,
    reason: "Retrait de l'inventaire par le propriétaire",
  });
  return ok({ removed: true });
}
