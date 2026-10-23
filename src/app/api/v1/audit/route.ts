// GET /api/v1/audit — journal d'audit (staff uniquement, append-only, sans données sensibles)
import { db } from "@/lib/db";
import { requireStaff, ok, apiFail, logAudit } from "@/lib/api";

export async function GET() {
  const staff = await requireStaff();
  if (!staff) return apiFail("FORBIDDEN", "Accès réservé au personnel habilité.", 403);
  const events = await db.auditEvent.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  await logAudit({
    actorId: staff.id, actorRole: staff.role,
    action: "audit.view", objectType: "audit",
  });
  return ok({ events });
}
