// GET /api/v1/backoffice/users — annuaire des comptes (espace Système)
import { db } from "@/lib/db";
import { ok, apiFail, requireBoSpace } from "@/lib/api";

export async function GET(req: Request) {
  const { user, space } = await requireBoSpace("system");
  if (!user) return apiFail("AUTH_REQUIRED", "Non authentifié.", 401);
  if (!space) return apiFail("FORBIDDEN", "Accès non autorisé à cet espace back-office.", 403);

  const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { fullName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
            { organization: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      _count: { select: { devices: true, incidents: true, sessions: true } },
    },
  });

  return ok({
    users: users.map((u) => ({
      id: u.id,
      fullName: u.fullName,
      phone: u.phone,
      email: u.email,
      role: u.role,
      organization: u.organization,
      verifiedAt: u.verifiedAt,
      createdAt: u.createdAt,
      devicesCount: u._count.devices,
      incidentsCount: u._count.incidents,
      sessionsCount: u._count.sessions,
    })),
  });
}
