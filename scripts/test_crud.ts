/**
 * Albatros Protect — Suite de vérification CRUD complète + persistance Neon.
 *
 * Pour chaque module du dashboard citoyen, teste C/R/U/D via l'API /api/v1
 * puis VÉRIFIE la persistance directement dans PostgreSQL (Neon).
 *
 * Usage : bun scripts/test_crud.ts
 */
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const BASE = "http://localhost:3000/api/v1";
const PG_URL = "postgresql://neondb_owner:npg_RxjI0EBsbAK2@ep-aged-surf-ba7ntcyv-pooler.c-8.eu-central-1.aws.neon.tech/Albatros%20Protect?sslmode=require&connect_timeout=10";

let cookie = "";
let passed = 0, failed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, extra = "") {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(name); console.log(`  ❌ ${name} ${extra}`); }
}

async function req(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookie = setCookie.split(";")[0];
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function pgQuery(sql: string, params: unknown[] = []) {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: PG_URL, max: 1 });
  try {
    const r = await pool.query(sql, params as any[]);
    return r.rows;
  } finally { await pool.end(); }
}

async function login(identifier: string) {
  console.log(`\n🔐 Connexion : ${identifier}`);
  const start = await req("POST", "/auth/otp/start", { identifier, purpose: "login" });
  const code = start.data.demo_code as string;
  check("OTP délivré (mode pilote)", !!code);
  const ver = await req("POST", "/auth/otp/verify", { identifier, code, purpose: "login" });
  check("Session ouverte", ver.status === 200 && !!ver.data.user, JSON.stringify(ver.data).slice(0, 120));
  return ver.data.user;
}

async function stepUp(identifier: string): Promise<string> {
  const start = await req("POST", "/auth/otp/start", { identifier, purpose: "step_up" });
  const code = start.data.demo_code as string;
  const ver = await req("POST", "/auth/otp/verify", { identifier, code, purpose: "step_up" });
  return ver.data.step_up_ticket as string;
}

async function main() {
  console.log("══════════════════════════════════════════════════");
  console.log("  SUITE CRUD ALBATROS PROTECT → PERSISTANCE NEON");
  console.log("══════════════════════════════════════════════════");

  const user = await login("+22997000001");
  check("Utilisateur = Awa Hounsou", user?.fullName === "Awa Hounsou");

  // ─────────────────────────── APPAREILS ───────────────────────────
  console.log("\n📱 MODULE APPAREILS");
  const list0 = await req("GET", "/devices");
  check("Liste lue (4 appareils seedés)", list0.status === 200 && list0.data.devices?.length >= 4, `reçu ${list0.data.devices?.length}`);

  const created = await req("POST", "/devices", {
    category: "smartphone", brand: "Xiaomi", model: "Redmi Note 13",
    color: "Vert", os_name: "Android", os_version: "14",
    identifiers: [{ type: "imei", value: "359871234567890" }],
  });
  const devId = created.data.device?.id;
  check("Appareil créé (Xiaomi Redmi Note 13)", created.status === 201 && !!devId, JSON.stringify(created.data).slice(0, 150));
  let rows = await pgQuery(`SELECT brand, model, "deviceId" FROM "Device" WHERE id=$1`, [devId]);
  check("PERSISTÉ dans Neon", rows.length === 1 && rows[0].brand === "Xiaomi" && rows[0].model === "Redmi Note 13");

  const updated = await req("PATCH", `/devices/${devId}`, { color: "Bleu nuit", os_version: "15" });
  check("Appareil mis à jour (couleur/OS)", updated.status === 200 && updated.data.device?.color === "Bleu nuit");
  rows = await pgQuery(`SELECT color, "osVersion" FROM "Device" WHERE id=$1`, [devId]);
  check("MAJ PERSISTÉE dans Neon", rows[0]?.color === "Bleu nuit" && rows[0]?.osVersion === "15");

  const enrolled = await req("POST", `/devices/${devId}/enrollment`);
  check("Enrôlement agent (+ 1re observation)", enrolled.status === 200 && !!enrolled.data.first_observation);
  rows = await pgQuery(`SELECT enrolled FROM "Device" WHERE id=$1`, [devId]);
  check("Enrôlement PERSISTÉ", rows[0]?.enrolled === true);

  // ─────────────────────────── OBSERVATIONS ───────────────────────────
  console.log("\n📍 MODULE OBSERVATIONS (géolocalisation + triangulation)");
  const ing = await req("POST", "/observations/location", {
    device_id: devId, source: "native_location",
    latitude: 9.3485, longitude: 2.6155, accuracy_radius_m: 25, captured_at: new Date().toISOString(),
  });
  check("Position native ingérée", ing.status === 201 && !!ing.data.observation, JSON.stringify(ing.data).slice(0, 150));
  rows = await pgQuery(`SELECT source, latitude, "accuracyRadiusM" FROM "LocationObservation" WHERE id=$1`, [ing.data.observation?.id]);
  check("Observation PERSISTÉE dans Neon", rows[0]?.source === "native_location" && Math.abs(rows[0]?.latitude - 9.3485) < 1e-9);

  const radio = await req("POST", "/observations/radio", { device_id: devId, wifi_points: 6, cell_towers: 3 });
  check("Estimation Wi-Fi/cellulaire (triangulation serveur)", radio.status === 201 && !!radio.data.observation?.latitude, JSON.stringify(radio.data).slice(0, 200));
  check("Rayon d'incertitude fourni", !!radio.data.observation?.accuracyRadiusM && radio.data.observation.accuracyRadiusM > 0);
  rows = await pgQuery(`SELECT source, "accuracyRadiusM" FROM "LocationObservation" WHERE id=$1`, [radio.data.observation?.id]);
  check("Estimation PERSISTÉE (google_geolocation)", rows[0]?.source === "google_geolocation");
  rows = await pgQuery(`SELECT COUNT(*)::int AS n FROM "RadioObservation" WHERE "deviceId"=$1`, [devId]);
  check("Trace radio PERSISTÉE (entrées brutes purgées)", rows[0]?.n >= 1);

  // Activation BLE pour la détection communautaire (module Préparation)
  await req("PATCH", `/devices/${devId}`, { ble_enabled: true });
  const ble = await req("POST", "/observations/ble", {
    device_id: devId, rssi: -71,
    detector_latitude: 9.3442, detector_longitude: 2.6171, detector_accuracy_m: 80,
  });
  check("Détection BLE ingérée", ble.status === 201 || ble.status === 200, JSON.stringify(ble.data).slice(0, 150));
  rows = await pgQuery(`SELECT COUNT(*)::int AS n FROM "BleEncounter" WHERE "targetDeviceId"=$1`, [devId]);
  check("Rencontre BLE PERSISTÉE dans Neon", (rows[0]?.n ?? 0) >= 1);

  const detail = await req("GET", `/devices/${devId}`);
  check("Détail appareil avec observations", detail.status === 200 && detail.data.observations?.length >= 2);

  // ─────────────────────────── INCIDENTS ───────────────────────────
  console.log("\n🚨 MODULE SIGNALEMENTS");
  const incList = await req("GET", "/incidents");
  check("Liste incidents (seed ≥ 2)", incList.status === 200 && incList.data.incidents?.length >= 2);

  const ticket = await stepUp("+22997000001");
  check("Vérification renforcée (step-up) obtenue", !!ticket);
  const inc = await req("POST", "/incidents", {
    device_id: devId, type: "theft", step_up_ticket: ticket,
    occurred_at: new Date(Date.now() - 3600_000).toISOString(),
    location_text: "Marché Arzeke, Parakou", latitude: 9.3433, longitude: 2.6089,
    description: "Vol de test automatisé — vérification CRUD.",
  });
  const incId = inc.data.incident?.id;
  check("Incident créé (vol)", inc.status === 201 && !!incId, JSON.stringify(inc.data).slice(0, 150));
  rows = await pgQuery(`SELECT "refNumber", status, type FROM "Incident" WHERE id=$1`, [incId]);
  check("Incident PERSISTÉ dans Neon (référence + statut)", rows.length === 1 && /^ALB-INC-\d{4}-/.test(rows[0].refNumber) && rows[0].status === "submitted");

  const incUp = await req("PATCH", `/incidents/${incId}`, { police_report_ref: "PJ-PK-2026-9999" });
  check("Référence plainte ajoutée", incUp.status === 200, JSON.stringify(incUp.data).slice(0, 120));
  rows = await pgQuery(`SELECT "policeReportRef" FROM "Incident" WHERE id=$1`, [incId]);
  check("Référence plainte PERSISTÉE", rows[0]?.policeReportRef === "PJ-PK-2026-9999");

  const incMap = await req("GET", `/incidents/${incId}/map?since_hours=24`);
  check("Carte d'incident (observations liées)", incMap.status === 200 && Array.isArray(incMap.data.observations));

  const incExport = await req("GET", `/incidents/${incId}/export`);
  check("Dossier exportable JSON", incExport.status === 200 && !!incExport.data.dossier?.reference || !!incExport.data.reference || !!incExport.data.incident, JSON.stringify(Object.keys(incExport.data)).slice(0, 120));

  const partner = await req("POST", `/incidents/${incId}/partner-requests`, {
    partner_type: "operator", partner_name: "MTN Bénin", request_type: "sim_suspension",
  });
  check("Demande partenaire préparée", partner.status === 200 || partner.status === 201, JSON.stringify(partner.data).slice(0, 150));
  rows = await pgQuery(`SELECT COUNT(*)::int AS n FROM "PartnerRequest" WHERE "incidentId"=$1`, [incId]);
  check("Demande partenaire PERSISTÉE", rows[0]?.n >= 1);

  // ─────────────────────────── CERCLES ───────────────────────────
  console.log("\n👪 MODULE CERCLES DE CONFIANCE");
  const circ = await req("POST", "/circles", { name: "Voisins Albarika" });
  const circId = circ.data.circle?.id;
  check("Cercle créé", circ.status === 201 || circ.status === 200, JSON.stringify(circ.data).slice(0, 120));
  rows = await pgQuery(`SELECT name FROM "Circle" WHERE id=$1`, [circId]);
  check("Cercle PERSISTÉ dans Neon", rows[0]?.name === "Voisins Albarika");

  const inv = await req("POST", `/circles/${circId}/invitations`, { name: "Bio Amadou", contact: "+22997000099" });
  const memberId = inv.data.membership?.id;
  check("Membre invité", (inv.status === 200 || inv.status === 201) && !!memberId, JSON.stringify(inv.data).slice(0, 150));
  rows = await pgQuery(`SELECT "inviteName", status FROM "CircleMembership" WHERE id=$1`, [memberId]);
  check("Membre PERSISTÉ", rows[0]?.inviteName === "Bio Amadou" && rows[0]?.status === "invited");

  const rm = await req("DELETE", `/circles/${circId}/members/${memberId}`);
  check("Membre retiré", rm.status === 200, JSON.stringify(rm.data).slice(0, 100));
  rows = await pgQuery(`SELECT COUNT(*)::int AS n FROM "CircleMembership" WHERE id=$1`, [memberId]);
  check("Retrait PERSISTÉ (0 ligne)", rows[0]?.n === 0);

  const dc = await req("DELETE", `/circles/${circId}`);
  check("Cercle supprimé", dc.status === 200);
  rows = await pgQuery(`SELECT COUNT(*)::int AS n FROM "Circle" WHERE id=$1`, [circId]);
  check("Suppression PERSISTÉE", rows[0]?.n === 0);

  // ─────────────────────────── PARTAGES ───────────────────────────
  console.log("\n🤝 MODULE PARTAGES");
  const listCircles = await req("GET", "/circles");
  const targetCircle = listCircles.data.circles?.[0];
  if (targetCircle) {
    const t2 = await stepUp("+22997000001");
    const grant = await req("POST", "/share-grants", {
      circle_id: targetCircle.id, data_shared: "status", duration_hours: 12, step_up_ticket: t2,
    });
    check("Partage créé", grant.status === 200 || grant.status === 201, JSON.stringify(grant.data).slice(0, 120));
    const gid = grant.data.grant?.id;
    if (gid) {
      rows = await pgQuery(`SELECT "dataShared" FROM "ShareGrant" WHERE id=$1`, [gid]);
      check("Partage PERSISTÉ", rows.length === 1);
      const rev = await req("DELETE", `/share-grants/${gid}`);
      check("Partage révoqué", rev.status === 200);
      rows = await pgQuery(`SELECT "revokedAt" FROM "ShareGrant" WHERE id=$1`, [gid]);
      check("Révocation PERSISTÉE (timestamp)", !!rows[0]?.revokedAt);
    }
  }

  // ─────────────────────────── DOCUMENTS & DROITS ───────────────────────────
  console.log("\n🧾 MODULE DOCUMENTS & CONFIDENTIALITÉ");
  const doc = await req("POST", "/documents", {
    name: "Facture Xiaomi test", doc_type: "purchase_proof", size_kb: 210, note: "Document de test automatisé",
  });
  check("Document enregistré", doc.status === 200 || doc.status === 201, JSON.stringify(doc.data).slice(0, 150));
  const docId = doc.data.document?.id;
  if (docId) {
    rows = await pgQuery(`SELECT name, "sizeKb" FROM "DocumentEntity" WHERE id=$1`, [docId]);
    check("Document PERSISTÉ dans Neon", rows[0]?.name === "Facture Xiaomi test" && rows[0]?.sizeKb === 210);
  }

  const priv = await req("POST", "/privacy/requests", { type: "access", details: "Test automatisé — accès aux données." });
  check("Demande RGPD créée", priv.status === 200 || priv.status === 201, JSON.stringify(priv.data).slice(0, 150));
  const privId = priv.data.request?.id;
  if (privId) {
    rows = await pgQuery(`SELECT type, status FROM "PrivacyRequest" WHERE id=$1`, [privId]);
    check("Demande RGPD PERSISTÉE", rows[0]?.type === "access" && rows[0]?.status === "received");
  }

  const consents = await req("GET", "/consents");
  check("Consentements lus", consents.status === 200 && consents.data.consents?.length >= 3);

  // ─────────────────────────── NETTOYAGE ───────────────────────────
  console.log("\n🧹 NETTOYAGE (Delete des données de test)");
  const del = await req("DELETE", `/devices/${devId}`);
  check("Appareil de test retiré (suppression douce)", del.status === 200, JSON.stringify(del.data).slice(0, 100));
  rows = await pgQuery(`SELECT status, enrolled FROM "Device" WHERE id=$1`, [devId]);
  check("Retrait PERSISTÉ (status=removed, désenrôlé)", rows[0]?.status === "removed" && rows[0]?.enrolled === false);
  rows = await pgQuery(`SELECT COUNT(*)::int AS o FROM "LocationObservation" WHERE "deviceId"=$1`, [devId]);
  check("Observations historisées conservées (auditabilité)", (rows[0]?.o ?? 0) >= 1);
  rows = await pgQuery(`SELECT COUNT(*)::int AS i FROM "Incident" WHERE "deviceId"=$1`, [devId]);
  check("Incident historisé conservé (auditabilité)", (rows[0]?.i ?? 0) >= 1);

  // ─────────────────────────── RÉSULTAT ───────────────────────────
  console.log("\n══════════════════════════════════════════════════");
  console.log(`  RÉSULTAT : ${passed} OK / ${failed} ÉCHEC(S)`);
  if (failures.length) console.log("  Échecs :", failures.join(" · "));
  console.log("══════════════════════════════════════════════════");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
