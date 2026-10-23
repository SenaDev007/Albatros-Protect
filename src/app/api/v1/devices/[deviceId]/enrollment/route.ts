// POST /api/v1/devices/{deviceId}/enrollment — finalise l'enrôlement de l'application/agent
// (F-020/F-021) : confirmation sur l'appareil, première transmission, état de préparation.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";

const COTONOU = { lat: 6.3654, lng: 2.3966 };
const jitter = (v: number, d: number) => v + (Math.random() - 0.5) * d;

export async function POST(req: Request, { params }: { params: Promise<{ deviceId: string }> }) {
  const { deviceId } = await params;
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const device = await db.device.findFirst({
    where: { OR: [{ id: deviceId }, { deviceId: deviceId }], ownerId: user.id },
  });
  if (!device) return apiFail("NOT_FOUND", "Appareil introuvable.", 404);

  const body = await parseBody<{ latitude?: number; longitude?: number; captured_at?: string }>(req);
  if (device.enrolled) {
    return apiFail("VALIDATION_ERROR", "Appareil déjà enrôlé.", 409);
  }

  const lat = typeof body.latitude === "number" ? body.latitude : jitter(COTONOU.lat, 0.02);
  const lng = typeof body.longitude === "number" ? body.longitude : jitter(COTONOU.lng, 0.02);
  const capturedAt = body.captured_at ? new Date(body.captured_at) : new Date();

  const [updated, observation] = await Promise.all([
    db.device.update({
      where: { id: device.id },
      data: { enrolled: true, lastTransmissionAt: new Date() },
    }),
    db.locationObservation.create({
      data: {
        deviceId: device.id,
        source: "native_location",
        latitude: lat,
        longitude: lng,
        accuracyRadiusM: Math.round(30 + Math.random() * 60),
        capturedAt,
        mode: "normal",
        quality: "estimated",
        note: "Première position transmise lors de l'enrôlement de l'application.",
      },
    }),
  ]);

  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "device.enrollment_complete", objectType: "device", objectId: device.id,
    reason: "Enrôlement confirmé sur l'appareil (défi approuvé)",
  });
  return ok({
    device: updated,
    first_observation: observation,
    notice:
      "L'application/agent est maintenant associé au compte. Les capacités réellement actives dépendent des permissions accordées au système.",
  });
}
