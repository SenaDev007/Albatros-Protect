// Nettoyage des données de test curl — restaure l'état du seed
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // 1. Incident de test créé via curl (Dell)
  const testInc = await db.incident.findFirst({ where: { refNumber: "ALB-INC-2026-0003" } });
  if (testInc) {
    await db.partnerRequest.deleteMany({ where: { incidentId: testInc.id } });
    await db.incidentEvent.deleteMany({ where: { incidentId: testInc.id } });
    await db.locationObservation.deleteMany({ where: { incidentId: testInc.id } });
    await db.incident.delete({ where: { id: testInc.id } });
    console.log("✓ incident de test supprimé");
  }
  // 2. Retour à l'état seed du Dell (non enrôlé — PC de bureau "portail seul")
  const dell = await db.device.findFirst({ where: { deviceId: "ALB-2V6R5D" } });
  if (dell) {
    await db.locationObservation.deleteMany({
      where: { deviceId: dell.id, note: { contains: "Enrôlement" } },
    });
    await db.device.update({
      where: { id: dell.id },
      data: { enrolled: false, lastTransmissionAt: null },
    });
    console.log("✓ Dell remis à l'état non enrôlé");
  }
  console.log("Nettoyage terminé.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
