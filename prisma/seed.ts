/**
 * Agent Albatros — Seed pilote (données de démonstration, Parakou)
 * Exécution : bun prisma/seed.ts
 * Les coordonnées sont illustratives ; aucune donnée réelle de citoyen.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const now = Date.now();
const ago = (min: number) => new Date(now - min * 60 * 1000);
const ahead = (h: number) => new Date(now + h * 3600 * 1000);

async function main() {
  console.log("🧹 Nettoyage…");
  await db.auditEvent.deleteMany();
  await db.privacyRequest.deleteMany();
  await db.shareGrant.deleteMany();
  await db.circleMembership.deleteMany();
  await db.circle.deleteMany();
  await db.partnerRequest.deleteMany();
  await db.incidentEvent.deleteMany();
  await db.locationObservation.deleteMany();
  await db.radioObservation.deleteMany();
  await db.bleEncounter.deleteMany();
  await db.documentEntity.deleteMany();
  await db.deviceIdentifier.deleteMany();
  await db.consentRecord.deleteMany();
  await db.incident.deleteMany();
  await db.device.deleteMany();
  await db.session.deleteMany();
  await db.otpCode.deleteMany();
  await db.user.deleteMany();

  console.log("👤 Utilisateurs…");
  const awa = await db.user.create({
    data: {
      phone: "+22997000001",
      email: "demo@albatros.bj",
      fullName: "Awa Hounsou",
      role: "admin", // rôle démo : accès console inclus (séparation réelle des rôles en production)
      verifiedAt: ago(60 * 24 * 12),
    },
  });
  await db.user.create({
    data: {
      email: "support@albatros.bj",
      fullName: "Agent support (démo)",
      role: "support",
      verifiedAt: ago(60 * 24 * 30),
    },
  });

  console.log("📱 Appareils…");
  const galaxy = await db.device.create({
    data: {
      deviceId: "ALB-7F3K2Q",
      ownerId: awa.id,
      category: "smartphone",
      brand: "Samsung",
      model: "Galaxy A54",
      color: "Noir",
      osName: "Android",
      osVersion: "14",
      status: "active",
      enrolled: true,
      locationEnabled: true,
      bleEnabled: true,
      notificationsEnabled: true,
      batteryOptimized: true,
      proofUploaded: true,
      identifiersComplete: true,
      lastTransmissionAt: ago(6),
    },
  });
  const ipad = await db.device.create({
    data: {
      deviceId: "ALB-9M2X8T",
      ownerId: awa.id,
      category: "tablet",
      brand: "Apple",
      model: "iPad (10e génération)",
      color: "Argent",
      osName: "iPadOS",
      osVersion: "17.4",
      status: "active",
      enrolled: true,
      locationEnabled: true,
      bleEnabled: true,
      notificationsEnabled: false,
      batteryOptimized: false,
      identifiersComplete: true,
      lastTransmissionAt: ago(120),
    },
  });
  const hp = await db.device.create({
    data: {
      deviceId: "ALB-4C8N1W",
      ownerId: awa.id,
      category: "laptop",
      brand: "HP",
      model: "Pavilion 15",
      color: "Gris",
      osName: "Windows",
      osVersion: "11",
      status: "active",
      enrolled: true,
      locationEnabled: true,
      bleEnabled: false,
      notificationsEnabled: false,
      batteryOptimized: false,
      identifiersComplete: false,
      lastTransmissionAt: ago(180),
    },
  });
  const dell = await db.device.create({
    data: {
      deviceId: "ALB-2V6R5D",
      ownerId: awa.id,
      category: "desktop",
      brand: "Dell",
      model: "OptiPlex 7010",
      color: "Noir",
      osName: "Ubuntu",
      osVersion: "22.04 LTS",
      status: "active",
      enrolled: false,
      identifiersComplete: false,
      lastTransmissionAt: null,
    },
  });

  console.log("🔎 Identifiants (masqués dans l'UI)…");
  await db.deviceIdentifier.createMany({
    data: [
      { deviceId: galaxy.id, type: "imei", value: "352094173501273", valueHmac: "hmac_a54_1", verified: true, proofDocId: "doc_facture_galaxy" },
      { deviceId: galaxy.id, type: "imei", value: "352094173501281", valueHmac: "hmac_a54_2", verified: true, proofDocId: "doc_facture_galaxy" },
      { deviceId: galaxy.id, type: "purchase_ref", value: "MTN-COT-2026-88412", valueHmac: "hmac_ref", verified: true },
      { deviceId: ipad.id, type: "serial", value: "DMPYD2X5Q1", valueHmac: "hmac_ipad", verified: true },
      { deviceId: hp.id, type: "serial", value: "5CD2349K11", valueHmac: "hmac_hp", verified: false },
      { deviceId: dell.id, type: "serial", value: "JH8X6K2", valueHmac: "hmac_dell", verified: false },
    ],
  });

  console.log("🧾 Justificatifs…");
  await db.documentEntity.createMany({
    data: [
      {
        id: "doc_facture_galaxy",
        userId: awa.id,
        deviceId: galaxy.id,
        name: "Facture Samsung Store Parakou",
        type: "purchase_proof",
        storageKey: "s3://albatros-docs/encrypted/demo/facture-galaxy.enc",
        sizeKb: 348,
        uploadedAt: ago(60 * 24 * 12),
        expiresAt: ahead(24 * 180),
      },
      {
        userId: awa.id,
        incidentId: null,
        deviceId: ipad.id,
        name: "Facture iStore Bénin",
        type: "purchase_proof",
        storageKey: "s3://albatros-docs/encrypted/demo/facture-ipad.enc",
        sizeKb: 512,
        uploadedAt: ago(60 * 24 * 8),
        expiresAt: ahead(24 * 120),
      },
    ],
  });

  console.log("🚨 Incidents…");
  const incVol = await db.incident.create({
    data: {
      refNumber: "ALB-INC-2026-0007",
      userId: awa.id,
      deviceId: galaxy.id,
      type: "theft",
      status: "processing",
      occurredAt: ago(60 * 26),
      locationText: "Grand marché Arzeke, Parakou",
      latitude: 9.3417,
      longitude: 2.6165,
      description: "Vol à l'arraché dans la foule vers 18h30, à la sortie du marché. Téléphone dans la poche avant droite.",
      simPhone: "+22996112233",
      policeReportRef: "PJ-PK-2026-0482",
    },
  });
  const incPerte = await db.incident.create({
    data: {
      refNumber: "ALB-INC-2026-0002",
      userId: awa.id,
      deviceId: ipad.id,
      type: "loss",
      status: "closed",
      occurredAt: ago(60 * 24 * 3),
      locationText: "Quartier Albarika, Parakou (taxi)",
      latitude: 9.3390,
      longitude: 2.6200,
      description: "Tablette oubliée sur le siège d'un taxi-zémidjan.",
      closedAt: ago(60 * 24 * 2),
      closeReason: "Appareil retrouvé et récupéré par le propriétaire.",
    },
  });

  console.log("📍 Observations de localisation (sources distinctes, jamais fusionnées)…");
  await db.locationObservation.createMany({
    data: [
      // Vol en cours — position native récente
      {
        deviceId: galaxy.id,
        incidentId: incVol.id,
        source: "native_location",
        latitude: 9.3450,
        longitude: 2.6100,
        accuracyRadiusM: 35,
        capturedAt: ago(12),
        receivedAt: ago(11),
        mode: "incident",
        quality: "estimated",
      },
      // Estimation Google Geolocation (Wi-Fi/cellulaire) — plus large
      {
        deviceId: galaxy.id,
        incidentId: incVol.id,
        source: "google_geolocation",
        latitude: 9.3430,
        longitude: 2.6150,
        accuracyRadiusM: 120,
        capturedAt: ago(25),
        receivedAt: ago(24),
        mode: "incident",
        quality: "approximate",
        note: "Estimation Wi-Fi/cellulaire — rayon d'incertitude fourni par le fournisseur.",
      },
      // Détection BLE communautaire — position du téléphone détecteur
      {
        deviceId: galaxy.id,
        incidentId: incVol.id,
        source: "ble_witness",
        latitude: 9.3390,
        longitude: 2.6200,
        accuracyRadiusM: 150,
        capturedAt: ago(40),
        receivedAt: ago(38),
        mode: "incident",
        quality: "approximate",
        note: "Détection Bluetooth par un téléphone participant à proximité — position du détecteur, pas un GPS de l'appareil.",
      },
      // Réponse partenaire (test) — ancienne, estompée
      {
        deviceId: galaxy.id,
        incidentId: incVol.id,
        source: "operator_authorized",
        latitude: 9.3500,
        longitude: 2.6000,
        accuracyRadiusM: 800,
        capturedAt: ago(60 * 5),
        receivedAt: ago(60 * 5),
        mode: "incident",
        quality: "approximate",
        note: "Zone communiquée dans le cadre autorisé — donnée de test, ancienne.",
      },
      // Dernière position connue avant incident (très ancienne)
      {
        deviceId: galaxy.id,
        source: "native_location",
        latitude: 9.3300,
        longitude: 2.6200,
        accuracyRadiusM: 90,
        capturedAt: ago(60 * 24 * 2),
        receivedAt: ago(60 * 24 * 2),
        mode: "normal",
        quality: "stale",
        note: "Dernière position connue avant l'incident.",
      },
      // PC portable — estimation Wi-Fi approximative, non joignable depuis 3h
      {
        deviceId: hp.id,
        source: "native_location",
        latitude: 9.3380,
        longitude: 2.6050,
        accuracyRadiusM: 250,
        capturedAt: ago(180),
        receivedAt: ago(179),
        mode: "normal",
        quality: "approximate",
        note: "PC sans GPS — estimation à partir des informations réseau disponibles.",
      },
      // iPad — dernière position au moment de la perte (dossier clôturé)
      {
        deviceId: ipad.id,
        incidentId: incPerte.id,
        source: "native_location",
        latitude: 9.3390,
        longitude: 2.6200,
        accuracyRadiusM: 60,
        capturedAt: ago(60 * 24 * 3),
        receivedAt: ago(60 * 24 * 3),
        mode: "incident",
        quality: "estimated",
      },
    ],
  });

  console.log("📶 Rencontres BLE + radio-observations (purge appliquée)…");
  await db.bleEncounter.create({
    data: {
      targetDeviceId: galaxy.id,
      tempIdentifier: "tmp-8f3a-rot-2214",
      rssi: -67,
      detectedAt: ago(40),
      detectorPositionLat: 6.366,
      detectorPositionLng: 2.4231,
      detectorAccuracyM: 150,
      validated: true,
      transmissionStatus: "delivered",
    },
  });
  await db.radioObservation.create({
    data: {
      deviceId: galaxy.id,
      payloadSummary: "7 points Wi-Fi observés (BSSID tronqués, non conservés)",
      consented: true,
      capturedAt: ago(25),
      processedAt: ago(24),
      purgedAt: ago(24),
      ttlExpiresAt: ago(20),
    },
  });

  console.log("⏱️ Chronologies d'incident…");
  await db.incidentEvent.createMany({
    data: [
      { incidentId: incVol.id, type: "created", label: "Signalement créé (vol)", detail: "Authentification renforcée validée par OTP.", actorRole: "owner", createdAt: ago(60 * 24) },
      { incidentId: incVol.id, type: "status_change", label: "Statut : soumis → vérification requise", detail: "Preuve de propriété et IMEI vérifiés par la console opérationnelle.", actorRole: "support", createdAt: ago(60 * 23) },
      { incidentId: incVol.id, type: "status_change", label: "Statut : prêt à transmettre", detail: "Dossier complet — prêt pour remise au partenaire via le canal officiel.", actorRole: "support", createdAt: ago(60 * 22) },
      { incidentId: incVol.id, type: "note", label: "Référence dépôt de plainte ajoutée", detail: "PJ-PK-2026-0482 ( commissariat central de Parakou).", actorRole: "owner", createdAt: ago(60 * 21) },
      { incidentId: incVol.id, type: "partner", label: "Demande opérateur préparée (inactive)", detail: "Aucune convention active : le dossier reste exportable par le propriétaire, la plateforme n'a pas transmis de demande au réseau.", actorRole: "system", createdAt: ago(60 * 20) },
      { incidentId: incVol.id, type: "status_change", label: "Statut : en traitement (démo partenaire)", detail: "Simulation pilote uniquement — aucun accord opérateur signé.", actorRole: "support", createdAt: ago(60 * 6) },
      { incidentId: incPerte.id, type: "created", label: "Signalement créé (perte)", actorRole: "owner", createdAt: ago(60 * 24 * 3) },
      { incidentId: incPerte.id, type: "status_change", label: "Statut : réponse reçue", detail: "Un proche du cercle a signalé l'appareil vu dans le taxi.", actorRole: "support", createdAt: ago(60 * 24 * 2.5) },
      { incidentId: incPerte.id, type: "closure", label: "Dossier clôturé — appareil retrouvé", detail: "Le propriétaire confirme la récupération.", actorRole: "owner", createdAt: ago(60 * 24 * 2) },
    ],
  });

  console.log("🤝 Demandes partenaires (aucune convention active)…");
  await db.partnerRequest.createMany({
    data: [
      { incidentId: incVol.id, partnerType: "operator", partnerName: "MTN Bénin", requestType: "sim_suspension", motive: "Suspension de la SIM déclarée dans le dossier ALB-INC-2026-0007", status: "inactive", note: "Flux inactif tant qu'aucune convention n'est signée (PARTNER_FLOW_NOT_ENABLED)." },
      { incidentId: incVol.id, partnerType: "authority", partnerName: "Police (Parakou)", requestType: "imei_block", motive: "Vérification et blocage IMEI à préparer selon critères convenus", status: "inactive", note: "Aucun flux police actif au pilote sans accord institutionnel." },
    ],
  });

  console.log("👪 Cercle de confiance…");
  const famille = await db.circle.create({
    data: { ownerId: awa.id, name: "Famille & proches" },
  });
  await db.circleMembership.createMany({
    data: [
      { circleId: famille.id, userId: null, inviteName: "Koffi Hounsou", inviteContact: "+22997000042", status: "active", joinedAt: ago(60 * 24 * 10) },
      { circleId: famille.id, userId: null, inviteName: "Sarah Adeyemi", inviteContact: "sarah@example.bj", status: "invited" },
    ],
  });
  await db.shareGrant.create({
    data: {
      circleId: famille.id,
      userId: awa.id,
      incidentId: incVol.id,
      dataShared: "status",
      expiresAt: ahead(24),
    },
  });

  console.log("✅ Consentements…");
  await db.consentRecord.createMany({
    data: [
      { userId: awa.id, deviceId: galaxy.id, purpose: "location", permission: "transmission_de_position", textVersion: "v1.0", granted: true, grantedAt: ago(60 * 24 * 12) },
      { userId: awa.id, deviceId: galaxy.id, purpose: "ble_detection", permission: "participation_reseau_detection", textVersion: "v1.1", granted: true, grantedAt: ago(60 * 24 * 11) },
      { userId: awa.id, deviceId: galaxy.id, purpose: "data_processing", permission: "traitement_donnees_dossier", textVersion: "v1.0", granted: true, grantedAt: ago(60 * 24 * 12) },
      { userId: awa.id, deviceId: ipad.id, purpose: "location", permission: "transmission_de_position", textVersion: "v1.0", granted: true, grantedAt: ago(60 * 24 * 8) },
      { userId: awa.id, deviceId: ipad.id, purpose: "ble_detection", permission: "participation_reseau_detection", textVersion: "v1.1", granted: false, grantedAt: ago(60 * 24 * 8), revokedAt: ago(60 * 24 * 2) },
    ],
  });

  console.log("📜 Journal d'audit…");
  await db.auditEvent.createMany({
    data: [
      { actorId: awa.id, actorRole: "citizen", action: "auth.login", objectType: "session", result: "success", createdAt: ago(60 * 24) },
      { actorId: awa.id, actorRole: "citizen", action: "incident.create", objectType: "incident", objectId: incVol.id, result: "success", reason: "Déclaration de vol après OTP renforcé", createdAt: ago(60 * 24) },
      { actorId: awa.id, actorRole: "support", action: "incident.status_change", objectType: "incident", objectId: incVol.id, result: "success", reason: "Vérification propriété + preuve", createdAt: ago(60 * 23) },
      { actorId: awa.id, actorRole: "citizen", action: "map.view", objectType: "incident", objectId: incVol.id, result: "success", reason: "Consultation carte (renforée)", createdAt: ago(60 * 22) },
      { actorId: awa.id, actorRole: "citizen", action: "incident.export", objectType: "incident", objectId: incVol.id, result: "success", createdAt: ago(60 * 21) },
      { actorId: awa.id, actorRole: "support", action: "incident.status_change", objectType: "incident", objectId: incVol.id, result: "success", reason: "Transmission démo partenaire", createdAt: ago(60 * 6) },
    ],
  });

  console.log("🔐 Demande d'exercice de droits (exemple)…");
  await db.privacyRequest.create({
    data: {
      userId: awa.id,
      type: "access",
      details: "Demande d'accès aux données de localisation conservées (exemple historique).",
      status: "done",
      createdAt: ago(60 * 24 * 7),
    },
  });

  console.log("✅ Seed terminé. Compte démo : +22997000001 (code OTP affiché à l'écran en mode démo).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
