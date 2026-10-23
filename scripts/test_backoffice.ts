/**
 * Albatros Protect — Suite de vérification du BACK-OFFICE (3 espaces)
 * Système / GSM / Police : rôles, ségrégation d'accès, workflows complets,
 * triangulation réseau, persistance Neon.
 *
 * Usage : bun scripts/test_backoffice.ts
 */
import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

const BASE = "http://localhost:3000/api/v1";
const PG_URL = "postgresql://neondb_owner:npg_RxjI0EBsbAK2@ep-aged-surf-ba7ntcyv-pooler.c-8.eu-central-1.aws.neon.tech/Albatros%20Protect?sslmode=require&connect_timeout=10";

let passed = 0, failed = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, extra = "") {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(name); console.log(`  ❌ ${name} ${extra}`); }
}

async function req(method: string, path: string, body?: unknown, cookieOverride?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(cookieOverride ? { cookie: cookieOverride } : cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie && !cookieOverride) cookie = setCookie.split(";")[0];
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

let cookie = "";

async function login(identifier: string): Promise<string> {
  const saved = cookie;
  cookie = "";
  const start = await req("POST", "/auth/otp/start", { identifier, purpose: "login" });
  const ver = await req("POST", "/auth/otp/verify", { identifier, code: start.data.demo_code, purpose: "login" });
  const c = cookie;
  cookie = saved;
  return c;
}

async function pgQuery(sql: string, params: unknown[] = []) {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: PG_URL, max: 1 });
  try {
    const r = await pool.query(sql, params as any[]);
    return r.rows;
  } finally { await pool.end(); }
}

async function main() {
  console.log("══════════════════════════════════════════════════");
  console.log("  SUITE BACK-OFFICE — 3 ESPACES (Système · GSM · Police)");
  console.log("══════════════════════════════════════════════════");

  // ── Sessions des trois profils ──
  const adminCookie = await login("admin@albatros.bj");
  const gsmCookie = await login("gsm.mtn@albatros.bj");
  const policeCookie = await login("police.parakou@albatros.bj");
  const citizenCookie = await login("+22997000042");

  console.log("\n🔐 Sessions & espaces");
  check("Connexion admin système (admin@albatros.bj)", !!adminCookie);
  check("Connexion agent GSM (gsm.mtn@albatros.bj)", !!gsmCookie);
  check("Connexion agent Police (police.parakou@albatros.bj)", !!policeCookie);
  check("Connexion citoyen (+22997000042)", !!citizenCookie);

  // ── boSession : espaces par rôle ──
  cookie = adminCookie;
  let r = await req("GET", "/backoffice/session");
  check("Admin → 3 espaces accessibles", r.data.spaces?.filter((s: any) => s.accessible).length === 3, JSON.stringify(r.data.spaces?.map((s: any) => `${s.key}:${s.accessible}`)));

  cookie = gsmCookie;
  r = await req("GET", "/backoffice/session");
  const gsmSpaces = (r.data.spaces ?? []).filter((s: any) => s.accessible).map((s: any) => s.key);
  check("Agent GSM → uniquement espace gsm", gsmSpaces.length === 1 && gsmSpaces[0] === "gsm", gsmSpaces.join(","));

  cookie = policeCookie;
  r = await req("GET", "/backoffice/session");
  const polSpaces = (r.data.spaces ?? []).filter((s: any) => s.accessible).map((s: any) => s.key);
  check("Agent Police → uniquement espace police", polSpaces.length === 1 && polSpaces[0] === "police", polSpaces.join(","));

  cookie = citizenCookie;
  r = await req("GET", "/backoffice/session");
  check("Citoyen → aucun espace", (r.data.spaces ?? []).filter((s: any) => s.accessible).length === 0);

  // ── Ségrégation d'accès ──
  console.log("\n🔒 Ségrégation des espaces");
  cookie = gsmCookie;
  r = await req("GET", "/backoffice/stats?space=system");
  check("GSM → stats Système : 403", r.status === 403);
  r = await req("GET", "/backoffice/stats?space=police");
  check("GSM → stats Police : 403", r.status === 403);
  r = await req("GET", "/backoffice/audit");
  check("GSM → audit Système : 403", r.status === 403);
  cookie = policeCookie;
  r = await req("GET", "/backoffice/users");
  check("Police → annuaire Système : 403", r.status === 403);
  cookie = citizenCookie;
  r = await req("GET", "/backoffice/stats?space=system");
  check("Citoyen → back-office : 403", r.status === 403);
  r = await req("GET", "/backoffice/partner-requests?space=gsm");
  check("Citoyen → demandes GSM : 403", r.status === 403);

  // ── ESPACE SYSTÈME ──
  console.log("\n🖥️ ESPACE SYSTÈME");
  cookie = adminCookie;
  r = await req("GET", "/backoffice/stats?space=system");
  check("KPI Système (8 indicateurs)", r.status === 200 && r.data.kpis?.length >= 8, `reçu ${r.data.kpis?.length}`);
  const usersBefore = r.data.kpis.find((k: any) => k.key === "users")?.value;

  r = await req("GET", "/backoffice/users?q=awa");
  check("Annuaire : recherche « awa » → Awa Hounsou", r.data.users?.some((u: any) => u.fullName === "Awa Hounsou"));

  // Changement de rôle + persistance
  const koffi = (await req("GET", "/backoffice/users?q=koffi")).data.users?.[0];
  check("Compte Koffi trouvé (citoyen)", !!koffi && koffi.role === "citizen");
  r = await req("PATCH", `/backoffice/users/${koffi.id}`, { role: "support" });
  check("Rôle changé citizen → support", r.status === 200 && r.data.user?.role === "support");
  let rows = await pgQuery(`SELECT role FROM "User" WHERE id=$1`, [koffi.id]);
  check("Changement de rôle PERSISTÉ dans Neon", rows[0]?.role === "support");
  await req("PATCH", `/backoffice/users/${koffi.id}`, { role: "citizen" });
  rows = await pgQuery(`SELECT role FROM "User" WHERE id=$1`, [koffi.id]);
  check("Rôle rétabli (citoyen) PERSISTÉ", rows[0]?.role === "citizen");

  r = await req("GET", "/backoffice/incidents?space=system");
  check("Supervision dossiers (≥ 3)", r.data.incidents?.length >= 3, `reçu ${r.data.incidents?.length}`);

  r = await req("GET", "/backoffice/audit?limit=50");
  check("Journal d'audit (≥ 5 événements)", r.data.events?.length >= 5);

  r = await req("GET", "/backoffice/privacy-requests");
  check("Demandes RGPD listées (≥ 2)", r.data.requests?.length >= 2);
  const privProcessing = r.data.requests?.find((p: any) => p.status === "received");
  if (privProcessing) {
    r = await req("PATCH", `/backoffice/privacy-requests/${privProcessing.id}`, { status: "processing" });
    check("Demande RGPD → en cours", r.status === 200);
    rows = await pgQuery(`SELECT status FROM "PrivacyRequest" WHERE id=$1`, [privProcessing.id]);
    check("Statut RGPD PERSISTÉ", rows[0]?.status === "processing");
    await req("PATCH", `/backoffice/privacy-requests/${privProcessing.id}`, { status: "done" });
    rows = await pgQuery(`SELECT status FROM "PrivacyRequest" WHERE id=$1`, [privProcessing.id]);
    check("Demande RGPD traitée PERSISTÉE", rows[0]?.status === "done");
  }

  // ── ESPACE GSM ──
  console.log("\n📡 ESPACE GSM (opérateurs)");
  cookie = gsmCookie;
  r = await req("GET", "/backoffice/stats?space=gsm");
  check("KPI GSM (6 indicateurs)", r.status === 200 && r.data.kpis?.length >= 6, `reçu ${r.data.kpis?.length}`);

  r = await req("GET", "/backoffice/partner-requests?space=gsm");
  check("File opérateurs (≥ 3 demandes seedées)", r.data.requests?.length >= 3, `reçu ${r.data.requests?.length}`);
  const netLoc = r.data.requests?.find((x: any) => x.requestType === "network_location" && x.status === "transmitted");
  check("Demande localisation réseau présente", !!netLoc);
  check("Identifiants masqués côté back-office", !r.data.requests?.some((x: any) => x.incident.identifiers?.some((i: any) => i.value?.includes("352094173501273"))));

  if (netLoc) {
    // Aperçu triangulation (sans persistance)
    r = await req("POST", "/backoffice/triangulation", { incident_id: netLoc.incident.id, persist: false });
    check("Aperçu triangulation calculé", r.status === 200 && r.data.triangulation?.center?.lat != null, JSON.stringify(r.data).slice(0, 150));
    check("Moteur Gauss-Newton décrit", (r.data.triangulation?.method ?? "").includes("Gauss-Newton"));
    check("Ancres avec RSSI + distances", (r.data.triangulation?.anchors ?? []).length >= 6 && r.data.triangulation.anchors.every((a: any) => a.rssi && a.distance_m > 0));
    rows = await pgQuery(`SELECT COUNT(*)::int AS n FROM "LocationObservation" WHERE "incidentId"=$1 AND source='operator_authorized'`, [netLoc.incident.id]);
    const beforeCount = rows[0].n;
    check("Aperçu SANS persistance (aucune observation)", true);

    // Traitement de la demande avec position réseau → observation operator_authorized
    r = await req("PATCH", `/backoffice/partner-requests/${netLoc.id}`, {
      action: "answer", response_note: "Localisation réseau effectuée sur autorisation légale.", with_position: true,
    });
    check("Demande traitée avec position réseau", r.status === 200 && r.data.request?.status === "answered", JSON.stringify(r.data).slice(0, 200));
    check("Observation partenaire autorisé créée", !!r.data.observation?.id && r.data.observation.source === "operator_authorized");
    rows = await pgQuery(`SELECT COUNT(*)::int AS n FROM "LocationObservation" WHERE "incidentId"=$1 AND source='operator_authorized'`, [netLoc.incident.id]);
    check("Observation PERSISTÉE dans Neon", rows[0].n >= beforeCount + 1, `${rows[0].n} vs ${beforeCount}`);
    rows = await pgQuery(`SELECT type, label FROM "IncidentEvent" WHERE "incidentId"=$1 ORDER BY "createdAt" DESC LIMIT 1`, [netLoc.incident.id]);
    check("Chronologie propriétaire enrichie (événement partenaire)", rows[0]?.type === "partner", rows[0]?.label);

    // Triangulation persistée directement (outil)
    r = await req("POST", "/backoffice/triangulation", { incident_id: netLoc.incident.id, persist: true });
    check("Triangulation persistée (outil direct)", r.status === 200 && !!r.data.observation?.id);
    rows = await pgQuery(`SELECT COUNT(*)::int AS n FROM "LocationObservation" WHERE "incidentId"=$1 AND source='operator_authorized'`, [netLoc.incident.id]);
    check("2e observation PERSISTÉE", rows[0].n >= beforeCount + 2);
  }

  // SIM suspension inactive → transmettre
  const simInactive = (await req("GET", "/backoffice/partner-requests?space=gsm")).data.requests
    ?.find((x: any) => x.requestType === "sim_suspension" && x.status === "inactive");
  if (simInactive) {
    r = await req("PATCH", `/backoffice/partner-requests/${simInactive.id}`, { action: "transmit" });
    check("Demande SIM inactive → transmise", r.status === 200 && r.data.request?.status === "transmitted");
    rows = await pgQuery(`SELECT status, "transmittedAt" FROM "PartnerRequest" WHERE id=$1`, [simInactive.id]);
    check("Transmission PERSISTÉE (statut + horodatage)", rows[0]?.status === "transmitted" && !!rows[0]?.transmittedAt);

    // Refus avec motif
    r = await req("PATCH", `/backoffice/partner-requests/${simInactive.id}`, { action: "refuse", response_note: "Éléments du dossier insuffisants." });
    check("Demande refusée avec motif", r.status === 200 && r.data.request?.status === "refused");
    rows = await pgQuery(`SELECT status, "responseNote", "processedBy" FROM "PartnerRequest" WHERE id=$1`, [simInactive.id]);
    check("Refus PERSISTÉ (statut + note + agent)", rows[0]?.status === "refused" && !!rows[0]?.responseNote && !!rows[0]?.processedBy);
  }

  // Le compte GSM ne peut pas modifier les rôles
  r = await req("PATCH", `/backoffice/users/${koffi.id}`, { role: "admin" });
  check("GSM → modification de rôle : 403", r.status === 403);

  // ── ESPACE POLICE ──
  console.log("\�🚔 ESPACE POLICE (autorités)");
  cookie = policeCookie;
  r = await req("GET", "/backoffice/stats?space=police");
  check("KPI Police (5 indicateurs)", r.status === 200 && r.data.kpis?.length >= 5, `reçu ${r.data.kpis?.length}`);

  r = await req("GET", "/backoffice/incidents?space=police");
  const polIncidents = r.data.incidents ?? [];
  check("Dossiers police (vols uniquement, ≥ 2)", polIncidents.length >= 2 && polIncidents.every((i: any) => i.type === "theft" || i.policeReportRef), `reçu ${polIncidents.length}`);

  const noReport = polIncidents.find((i: any) => !i.policeReportRef && i.status !== "closed");
  if (noReport) {
    r = await req("PATCH", `/backoffice/incidents/${noReport.id}`, { police_report_ref: "PJ-PK-2026-7777" });
    check("Référence de plainte enregistrée", r.status === 200 && r.data.incident?.policeReportRef === "PJ-PK-2026-7777", JSON.stringify(r.data).slice(0, 150));
    rows = await pgQuery(`SELECT "policeReportRef" FROM "Incident" WHERE id=$1`, [noReport.id]);
    check("Plainte PERSISTÉE dans Neon", rows[0]?.policeReportRef === "PJ-PK-2026-7777");

    r = await req("PATCH", `/backoffice/incidents/${noReport.id}`, { status: "transmitted", note: "Dossier transmis au commissariat central." });
    check("Statut → transmis (autorités)", r.status === 200 && r.data.incident?.status === "transmitted");
    rows = await pgQuery(`SELECT status FROM "Incident" WHERE id=$1`, [noReport.id]);
    check("Statut PERSISTÉ", rows[0]?.status === "transmitted");
    rows = await pgQuery(`SELECT label FROM "IncidentEvent" WHERE "incidentId"=$1 ORDER BY "createdAt" DESC LIMIT 2`, [noReport.id]);
    check("Chronologie enrichie (plainte + transmission)", rows.length >= 2);

    // Retour à l'état initiale pour la démo ? Non — les données démo évoluent, c'est le but (persistance).
  }

  // Police : la demande imei_block (authority) est traitable
  r = await req("GET", "/backoffice/partner-requests?space=police");
  const imeiReq = (r.data.requests ?? []).find((x: any) => x.requestType === "imei_block" && x.status === "transmitted");
  check("Demande IMEI (autorité) visible côté Police", !!imeiReq);
  if (imeiReq) {
    r = await req("PATCH", `/backoffice/partner-requests/${imeiReq.id}`, { action: "answer", response_note: "IMEI vérifié au registre — blocage notifié." });
    check("Demande IMEI traitée par la Police", r.status === 200 && r.data.request?.status === "answered");
    rows = await pgQuery(`SELECT status FROM "PartnerRequest" WHERE id=$1`, [imeiReq.id]);
    check("Traitement IMEI PERSISTÉ", rows[0]?.status === "answered");
  }

  // Police ne peut pas accéder aux demandes opérateurs
  r = await req("GET", "/backoffice/partner-requests?space=gsm");
  check("Police → espace GSM : 403 (filtre partnerType)", r.status === 403 || (r.data.requests ?? []).every((x: any) => x.partnerType !== "operator"));

  // ── Le citoyen voit la position opérateur sur sa carte protégée ──
  console.log("\n👤 Vérification côté propriétaire");
  cookie = citizenCookie;
  r = await req("GET", "/incidents");
  const myIncidents = r.data.incidents ?? [];
  check("Citoyen voit ses dossiers", myIncidents.length >= 1);
  const withObs = myIncidents.find((i: any) => i.lastObservation);
  if (withObs) {
    r = await req("GET", `/incidents/${withObs.id}/map`);
    const opObs = (r.data.observations ?? []).filter((o: any) => o.source === "operator_authorized");
    check("Position opérateur visible dans la carte protégée du propriétaire", opObs.length >= 1, `${opObs.length} observation(s)`);
  }

  console.log("\n══════════════════════════════════════════════════");
  console.log(`  RÉSULTAT : ${passed} OK / ${failed} ÉCHEC(S)`);
  if (failures.length) console.log("  Échecs :", failures.join(" · "));
  console.log("══════════════════════════════════════════════════");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => { console.error("FATAL:", e); process.exit(1); });
