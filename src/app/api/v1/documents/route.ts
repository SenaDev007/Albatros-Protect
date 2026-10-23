// GET /api/v1/documents — pièces justificatives (métadonnées ; contenu chiffré hors périmètre UI)
// POST /api/v1/documents — dépôt simulé (F-012) : stockage objet chiffré côté serveur
import { db } from "@/lib/db";
import { requireUser, ok, apiFail, parseBody, logAudit } from "@/lib/api";
import { randomBytes } from "crypto";

export async function GET() {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const documents = await db.documentEntity.findMany({
    where: { userId: user.id },
    orderBy: { uploadedAt: "desc" },
  });
  return ok({ documents });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  const body = await parseBody<{
    name?: string;
    type?: string;
    device_id?: string;
    incident_id?: string;
    size_kb?: number;
    note?: string;
  }>(req);
  const name = (body.name ?? "").trim();
  const type = ["purchase_proof", "police_report", "other"].includes(body.type ?? "") ? body.type! : "other";
  if (!name) return apiFail("VALIDATION_ERROR", "Nom du document requis.", 422);

  let deviceId = body.device_id ?? null;
  if (deviceId) {
    const device = await db.device.findFirst({ where: { id: deviceId, ownerId: user.id } });
    if (!device) return apiFail("NOT_FOUND", "Appareil introuvable.", 404);
    deviceId = device.id;
  }
  let incidentId = body.incident_id ?? null;
  if (incidentId) {
    const incident = await db.incident.findFirst({ where: { id: incidentId, userId: user.id } });
    if (!incident) return apiFail("NOT_FOUND", "Dossier introuvable.", 404);
    incidentId = incident.id;
  }

  const document = await db.documentEntity.create({
    data: {
      userId: user.id,
      deviceId,
      incidentId,
      name,
      type,
      storageKey: `s3://albatros-docs/encrypted/${user.id}/${randomBytes(8).toString("hex")}.enc`,
      sizeKb: body.size_kb ?? 256,
      note: body.note?.trim() || null,
      expiresAt: new Date(Date.now() + 180 * 86400 * 1000), // conservation limitée (§9.2)
    },
  });
  if (deviceId && type === "purchase_proof") {
    await db.device.update({ where: { id: deviceId }, data: { proofUploaded: true } });
  }
  await logAudit({
    actorId: user.id, actorRole: user.role,
    action: "document.upload", objectType: "document", objectId: document.id,
    reason: `${type} — conservation contrôlée 180 jours`,
  });
  return ok({
    document,
    notice:
      "Pièce chiffrée côté serveur, accès journalisé. La durée de conservation est contrôlée et exposée (F-062).",
  }, 201);
}
