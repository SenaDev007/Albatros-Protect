/**
 * Albatros Protect — Seed pilote (données de démonstration, Parakou)
 * Exécution : DATABASE_URL="postgresql://…" bun prisma/seed.ts
 * Les coordonnées sont illustratives ; aucune donnée réelle de citoyen.
 *
 * Comptes de démonstration (OTP affiché à l'écran en mode pilote) :
 *  - Citoyenne/admin démo : +22997000001 (Awa Hounsou)
 *  - Back-office Système  : admin@albatros.bj (Admin Système)
 *  - Back-office GSM      : gsm.mtn@albatros.bj (Ibrahim Moussa — MTN Bénin)
 *  - Back-office Police   : police.parakou@albatros.bj (Commissariat central Parakou)
 */
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL!, max: 1 });
const adapter = new PrismaPg(pool);
const db = new PrismaClient({ adapter });

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

  console.log("👤 Utilisateurs (citoyens + back-office)…");
  const awa = await db.user.create({
    data: {
      phone: "+22997000001",
      email: "demo@albatros.bj",
      fullName: "Awa Hounsou",
      role: "citizen",
      verifiedAt: ago(60 * 24 * 12),
    },
  });
  const koffi = await db.user.create({
    data: {
      phone: "+22997000042",
      fullName: "Koffi Hounsou",
      role: "citizen",
      verifiedAt: ago(60 * 24 * 10),
    },
  });
  // --- Comptes back-office (trois espaces distincts) ---
  const adminSys = await db.user.create({
    data: {
      email: "admin@albatros.bj",
      fullName: "Admin Système",
      role: "admin",
      organization: "Albatros Protect",
      verifiedAt: ago(60 * 24 * 30),
    },
  });
  const support = await db.user.create({
    data: {
      email: "support@albatros.bj",
      fullName: "Agent support (démo)",
      role: "support",
      organization: "Albatros Protect",
      verifiedAt: ago(60 * 24 * 30),
    },
  });
  const agentGsm = await db.user.create({
    data: {
      email: "gsm.mtn@albatros.bj",
      fullName: "Ibrahim Moussa",
      role: "gsm_operator",
      organization: "MTN Bénin",
      verifiedAt: ago(60 * 24 * 20),
    },
  });
  const agentPolice = await db.user.create({
    data: {
      email: "police.parakou@albatros.bj",
      fullName: "Inspecteur Sanni Bio",
      role: "police_officer",
      organization: "Police (Parakou)",
      verifiedAt: ago(60 * 24 * 20),
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
  const tecno = await db.device.create({
    data: {
      deviceId: "ALB-8T4M9R",
      ownerId: koffi.id,
      category: "smartphone",
      brand: "Tecno",
      model: "Camon 20",
      color: "Bleu",
      osName: "Android",
      osVersion: "13",
      status: "active",
      enrolled: true,
      locationEnabled: true,
      bleEnabled: true,
      notificationsEnabled: true,
      batteryOptimized: false,
      proofUploaded: true,
      identifiersComplete: true,
      lastTransmissionAt: ago(45),
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
      { deviceId: tecno.id, type: "imei", value: "351890114328761", valueHmac: "hmac_tecno", verified: true },
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
  const incVol2 = await db.incident.create({
    data: {
      refNumber: "ALB-INC-2026-0008",
      userId: koffi.id,
      deviceId: tecno.id,
      type: "theft",
      status: "ready_to_transmit",
      occurredAt: ago(60 * 8),
      locationText: "Station Total, quartier Banikanni, Parakou",
      latitude: 9.3521,
      longitude: 2.6122,
      description: "Téléphone arraché par deux individifs à moto vers 20h15, devant la station-service.",
      simPhone: "+22997223344",
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
      latitude: 9.339,
      longitude: 2.62,
      description: "Tablette oubliée sur le siège d'un taxi-zémidjan.",
      closedAt: ago(60 * 24 * 2),
      closeReason: "Appareil retrouvé et récupéré par le propriétaire.",
    },
  });

  console.log("📍 Observations de localisation (sources distinctes, jamais fusionnées)…");
  await db.locationObservation.createMany({
    data: [
      {
        deviceId: galaxy.id,
        incidentId: incVol.id,
        source: "native_location",
        latitude: 9.345,
        longitude: 2.61,
        accuracyRadiusM: 35,
        capturedAt: ago(12),
        receivedAt: ago(11),
        mode: "incident",
        quality: "estimated",
      },
      {
        deviceId: galaxy.id,
        incidentId: incVol.id,
        source: "google_geolocation",
        latitude: 9.343,
        longitude: 2.615,
        accuracyRadiusM: 120,
        capturedAt: ago(25),
        receivedAt: ago(24),
        mode: "incident",
        quality: "approximate",
        note: "Estimation Wi-Fi/cellulaire — rayon d'incertitude fourni par le fournisseur.",
      },
      {
        deviceId: galaxy.id,
        incidentId: incVol.id,
        source: "ble_witness",
        latitude: 9.339,
        longitude: 2.62,
        accuracyRadiusM: 150,
        capturedAt: ago(40),
        receivedAt: ago(38),
        mode: "incident",
        quality: "approximate",
        note: "Détection Bluetooth par un téléphone participant à proximité — position du détecteur, pas un GPS de l'appareil.",
      },
      {
        deviceId: galaxy.id,
        incidentId: incVol.id,
        source: "operator_authorized",
        latitude: 9.35,
        longitude: 2.6,
        accuracyRadiusM: 800,
        capturedAt: ago(60 * 5),
        receivedAt: ago(60 * 5),
        mode: "incident",
        quality: "approximate",
        note: "Zone communiquée dans le cadre autorisé — donnée de test, ancienne.",
      },
      {
        deviceId: galaxy.id,
        source: "native_location",
        latitude: 9.33,
        longitude: 2.62,
        accuracyRadiusM: 90,
        capturedAt: ago(60 * 24 * 2),
        receivedAt: ago(60 * 24 * 2),
        mode: "normal",
        quality: "stale",
        note: "Dernière position connue avant l'incident.",
      },
      // Incident 2 (Koffi) — observations récentes pour la triangulation GSM
      {
        deviceId: tecno.id,
        incidentId: incVol2.id,
        source: "native_location",
        latitude: 9.3518,
        longitude: 2.6144,
        accuracyRadiusM: 28,
        capturedAt: ago(35),
        receivedAt: ago(34),
        mode: "incident",
        quality: "precise",
      },
      {
        deviceId: tecno.id,
        incidentId: incVol2.id,
        source: "google_geolocation",
        latitude: 9.3535,
        longitude: 2.6108,
        accuracyRadiusM: 95,
        capturedAt: ago(20),
        receivedAt: ago(19),
        mode: "incident",
        quality: "approximate",
        note: "Estimation Wi-Fi/cellulaire — rayon d'incertitude fourni par le fournisseur.",
      },
      {
        deviceId: hp.id,
        source: "native_location",
        latitude: 9.338,
        longitude: 2.605,
        accuracyRadiusM: 250,
        capturedAt: ago(180),
        receivedAt: ago(179),
        mode: "normal",
        quality: "approximate",
        note: "PC sans GPS — estimation à partir des informations réseau disponibles.",
      },
      {
        deviceId: ipad.id,
        incidentId: incPerte.id,
        source: "native_location",
        latitude: 9.339,
        longitude: 2.62,
        accuracyRadiusM: 60,
        capturedAt: ago(60 * 24 * 3),
        receivedAt: ago(60 * 24 * 3),
        mode: "incident",
        quality: "estimated",
      },
    ],
  });

  console.log("📶 Rencontres BLE + radio-observations (purge appliquée)…");
  await db.bleEncounter.createMany({
    data: [
      {
        targetDeviceId: galaxy.id,
        tempIdentifier: "tmp-8f3a-rot-2214",
        rssi: -67,
        detectedAt: ago(40),
        detectorPositionLat: 9.339,
        detectorPositionLng: 2.62,
        detectorAccuracyM: 150,
        validated: true,
        transmissionStatus: "delivered",
      },
      {
        targetDeviceId: tecno.id,
        tempIdentifier: "tmp-c21b-rot-8837",
        rssi: -74,
        detectedAt: ago(55),
        detectorPositionLat: 9.3505,
        detectorPositionLng: 2.6131,
        detectorAccuracyM: 120,
        validated: true,
        transmissionStatus: "delivered",
      },
    ],
  });
  await db.radioObservation.createMany({
    data: [
      {
        deviceId: galaxy.id,
        payloadSummary: "7 points Wi-Fi observés (BSSID tronqués, non conservés)",
        consented: true,
        capturedAt: ago(25),
        processedAt: ago(24),
        purgedAt: ago(24),
        ttlExpiresAt: ago(20),
      },
      {
        deviceId: tecno.id,
        payloadSummary: "5 points Wi-Fi, 3 antennes — valeurs brutes non conservées",
        consented: true,
        capturedAt: ago(20),
        processedAt: ago(19),
        purgedAt: ago(19),
        ttlExpiresAt: ago(15),
      },
    ],
  });

  console.log("⏱️ Chronologies d'incident…");
  await db.incidentEvent.createMany({
    data: [
      { incidentId: incVol.id, type: "created", label: "Signalement créé (vol)", detail: "Authentification renforcée validée par OTP.", actorRole: "owner", createdAt: ago(60 * 24) },
      { incidentId: incVol.id, type: "status_change", label: "Statut : soumis → vérification requise", detail: "Preuve de propriété et IMEI vérifiés par la console opérationnelle.", actorRole: "support", createdAt: ago(60 * 23) },
      { incidentId: incVol.id, type: "status_change", label: "Statut : prêt à transmettre", detail: "Dossier complet — prêt pour remise au partenaire via le canal officiel.", actorRole: "support", createdAt: ago(60 * 22) },
      { incidentId: incVol.id, type: "note", label: "Référence dépôt de plainte ajoutée", detail: "PJ-PK-2026-0482 (commissariat central de Parakou).", actorRole: "owner", createdAt: ago(60 * 21) },
      { incidentId: incVol.id, type: "partner", label: "Demande opérateur préparée (inactive)", detail: "Aucune convention active : le dossier reste exportable par le propriétaire, la plateforme n'a pas transmis de demande au réseau.", actorRole: "system", createdAt: ago(60 * 20) },
      { incidentId: incVol.id, type: "status_change", label: "Statut : en traitement (démo partenaire)", detail: "Simulation pilote uniquement — aucun accord opérateur signé.", actorRole: "support", createdAt: ago(60 * 6) },
      { incidentId: incVol2.id, type: "created", label: "Signalement créé (vol)", detail: "Authentification renforcée validée par OTP.", actorRole: "owner", createdAt: ago(60 * 7) },
      { incidentId: incVol2.id, type: "status_change", label: "Statut : soumis → vérification requise", detail: "Preuve de propriété et IMEI vérifiés par la console opérationnelle.", actorRole: "support", createdAt: ago(60 * 5) },
      { incidentId: incVol2.id, type: "status_change", label: "Statut : prêt à transmettre", detail: "Dossier complet — prêt pour remise au partenaire via le canal officiel.", actorRole: "support", createdAt: ago(60 * 3) },
      { incidentId: incPerte.id, type: "created", label: "Signalement créé (perte)", actorRole: "owner", createdAt: ago(60 * 24 * 3) },
      { incidentId: incPerte.id, type: "status_change", label: "Statut : réponse reçue", detail: "Un proche du cercle a signalé l'appareil vu dans le taxi.", actorRole: "support", createdAt: ago(60 * 24 * 2.5) },
      { incidentId: incPerte.id, type: "closure", label: "Dossier clôturé — appareil retrouvé", detail: "Le propriétaire confirme la récupération.", actorRole: "owner", createdAt: ago(60 * 24 * 2) },
    ],
  });

  console.log("🤝 Demandes partenaires (file back-office GSM / Police)…");
  await db.partnerRequest.createMany({
    data: [
      {
        incidentId: incVol.id, partnerType: "operator", partnerName: "MTN Bénin",
        requestType: "sim_suspension", motive: "Suspension de la SIM déclarée dans le dossier ALB-INC-2026-0007",
        status: "transmitted", note: "Demande transmise via le back-office GSM (simulation pilote).",
        transmittedAt: ago(60 * 5), createdAt: ago(60 * 6),
      },
      {
        incidentId: incVol.id, partnerType: "authority", partnerName: "Police (Parakou)",
        requestType: "imei_block", motive: "Vérification et blocage IMEI à préparer selon critères convenus",
        status: "transmitted", note: "Transmise au commissariat central via le back-office Police.",
        transmittedAt: ago(60 * 4), createdAt: ago(60 * 5),
      },
      {
        incidentId: incVol2.id, partnerType: "operator", partnerName: "MTN Bénin",
        requestType: "network_location", motive: "Localisation réseau autorisée — dossier ALB-INC-2026-0008 (plainte en cours)",
        status: "transmitted", note: "Demande de localisation réseau légale transmise via le back-office GSM.",
        transmittedAt: ago(60 * 2), createdAt: ago(60 * 3),
      },
      {
        incidentId: incVol2.id, partnerType: "operator", partnerName: "MTN Bénin",
        requestType: "sim_suspension", motive: "Suspension de la SIM déclarée dans le dossier ALB-INC-2026-0008",
        status: "inactive", note: "Préparée par le propriétaire — en attente de transmission.",
        createdAt: ago(60 * 3),
      },
    ],
  });

  console.log("👪 Cercle de confiance…");
  const famille = await db.circle.create({
    data: { ownerId: awa.id, name: "Famille & proches" },
  });
  await db.circleMembership.createMany({
    data: [
      { circleId: famille.id, userId: koffi.id, inviteName: "Koffi Hounsou", inviteContact: "+22997000042", status: "active", joinedAt: ago(60 * 24 * 10) },
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
      { userId: koffi.id, deviceId: tecno.id, purpose: "location", permission: "transmission_de_position", textVersion: "v1.0", granted: true, grantedAt: ago(60 * 24 * 9) },
    ],
  });

  console.log("📜 Journal d'audit…");
  await db.auditEvent.createMany({
    data: [
      { actorId: awa.id, actorRole: "citizen", action: "auth.login", objectType: "session", result: "success", createdAt: ago(60 * 24) },
      { actorId: awa.id, actorRole: "citizen", action: "incident.create", objectType: "incident", objectId: incVol.id, result: "success", reason: "Déclaration de vol après OTP renforcé", createdAt: ago(60 * 24) },
      { actorId: support.id, actorRole: "support", action: "incident.status_change", objectType: "incident", objectId: incVol.id, result: "success", reason: "Vérification propriété + preuve", createdAt: ago(60 * 23) },
      { actorId: awa.id, actorRole: "citizen", action: "map.view", objectType: "incident", objectId: incVol.id, result: "success", reason: "Consultation carte (renforcée)", createdAt: ago(60 * 22) },
      { actorId: awa.id, actorRole: "citizen", action: "incident.export", objectType: "incident", objectId: incVol.id, result: "success", createdAt: ago(60 * 21) },
      { actorId: adminSys.id, actorRole: "admin", action: "backoffice.login", objectType: "session", result: "success", createdAt: ago(60 * 5) },
      { actorId: agentGsm.id, actorRole: "gsm_operator", action: "backoffice.partner_request.transmit", objectType: "partner_request", objectId: incVol.id, result: "success", reason: "Suspension SIM — dossier ALB-INC-2026-0007", createdAt: ago(60 * 5) },
      { actorId: agentPolice.id, actorRole: "police_officer", action: "backoffice.partner_request.transmit", objectType: "partner_request", objectId: incVol.id, result: "success", reason: "Blocage IMEI — dossier ALB-INC-2026-0007", createdAt: ago(60 * 4) },
    ],
  });

  console.log("🔐 Demandes d'exercice de droits…");
  await db.privacyRequest.createMany({
    data: [
      {
        userId: awa.id, type: "access",
        details: "Demande d'accès aux données de localisation conservées (exemple historique).",
        status: "done", createdAt: ago(60 * 24 * 7),
      },
      {
        userId: koffi.id, type: "rectification",
        details: "Correction de la marque de l'appareil déclaré (Tecno Camon 20, pas 19).",
        status: "received", createdAt: ago(60 * 30),
      },
    ],
  });

  console.log("✅ Seed terminé.");
  console.log("   Citoyenne démo     : +22997000001 (OTP à l'écran)");
  console.log("   Back-office Système : admin@albatros.bj");
  console.log("   Back-office GSM     : gsm.mtn@albatros.bj (MTN Bénin)");
  console.log("   Back-office Police  : police.parakou@albatros.bj");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
    await pool.end();
  });
