// Albatros Protect — moteur de géolocalisation et triangulation
// Trilateration par moindres carrés (Gauss-Newton amorti) sur plan local,
// estimation de distance RSSI (log-distance path loss), rayon d'incertitude
// issu des résidus et de la dilution géométrique (GDOP simplifié).
// Utilisé par l'adaptateur Wi-Fi/cellulaire (§7) et le back-office GSM.

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface RadioAnchor {
  id: string;
  kind: "cell" | "wifi";
  label: string;
  lat: number;
  lng: number;
  /** Puissance du signal reçue (dBm) — facultatif. */
  rssi?: number;
  /** Distance estimée à la source (mètres). */
  distanceM: number;
}

export interface TriangulationResult {
  point: GeoPoint;
  /** Rayon d'incertitude (mètres) — jamais fabriqué : issu des résidus réels. */
  accuracyRadiusM: number;
  /** RMS des résidus (mètres). */
  residualRmsM: number;
  /** Erreur théorique max entre estimateur et cercles (mètres). */
  spreadM: number;
  iterations: number;
  converged: boolean;
  anchors: RadioAnchor[];
  method: string;
}

const EARTH_R = 6371008.8; // rayon moyen WGS84 (m)

/** Distance orthodromique en mètres (formule de haversine). */
export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * toRad;
  const dLng = (b.lng - a.lng) * toRad;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/**
 * Estimation de distance depuis un RSSI — modèle log-distance
 * (path loss exponent n≈2.7 en environnement urbain dense,
 * puissance de référence -45 dBm à 1 m pour du Wi-Fi 2,4 GHz).
 */
export function rssiToDistanceMeters(rssi: number, refPowerDbm = -45, pathLossN = 2.7): number {
  const d = Math.pow(10, (refPowerDbm - rssi) / (10 * pathLossN));
  // Saturation réaliste : ~2 m à ~2 km exploitables
  return Math.max(2, Math.min(2000, d));
}

/** Décale un point de (est, nord) en mètres — projection locale équirectangulaire. */
export function offsetMeters(p: GeoPoint, eastM: number, northM: number): GeoPoint {
  const dLat = (northM / EARTH_R) * (180 / Math.PI);
  const dLng = (eastM / (EARTH_R * Math.cos((p.lat * Math.PI) / 180))) * (180 / Math.PI);
  return { lat: p.lat + dLat, lng: p.lng + dLng };
}

/** Convertit des points géographiques en plan local (mètres, origine = centroïde). */
function toLocalPlane(points: GeoPoint[], origin: GeoPoint): { x: number; y: number }[] {
  return points.map((p) => {
    const gx = haversineMeters({ lat: origin.lat, lng: p.lng }, origin);
    const gy = haversineMeters({ lat: p.lat, lng: origin.lng }, origin);
    return { x: p.lng >= origin.lng ? gx : -gx, y: p.lat >= origin.lat ? gy : -gy };
  });
}

/**
 * Trilateration : cherche le point minimisant Σ (‖pᵢ − x‖ − dᵢ)².
 * Gauss-Newton avec amortissement de Levenberg-Marquardt, plan local
 * autour du centroïde des ancres, retour en coordonnées géographiques.
 */
export function trilaterate(
  anchors: RadioAnchor[],
  options: { maxIterations?: number; toleranceM?: number } = {},
): TriangulationResult | null {
  const { maxIterations = 60, toleranceM = 0.5 } = options;
  if (anchors.length < 3) return null;

  const centroid: GeoPoint = {
    lat: anchors.reduce((s, a) => s + a.lat, 0) / anchors.length,
    lng: anchors.reduce((s, a) => s + a.lng, 0) / anchors.length,
  };
  const local = toLocalPlane(
    anchors.map((a) => ({ lat: a.lat, lng: a.lng })),
    centroid,
  );
  const dists = anchors.map((a) => a.distanceM);

  // Point initial : moyenne pondérée par l'inverse des distances (les ancres
  // proches pèsent davantage), repli sur le centroïde.
  let x = 0,
    y = 0,
    wSum = 0;
  for (let i = 0; i < local.length; i++) {
    const w = 1 / Math.max(dists[i], 1);
    x += local[i].x * w;
    y += local[i].y * w;
    wSum += w;
  }
  if (wSum > 0) { x /= wSum; y /= wSum; }

  let lambda = 1e-3;
  let iterations = 0;
  let converged = false;
  let residualRmsM = Infinity;
  const dist = (px: number, py: number, i: number) =>
    Math.hypot(px - local[i].x, py - local[i].y);

  for (; iterations < maxIterations; iterations++) {
    // Résidus, jacobienne (pondérée : les mesures courtes sont plus fiables)
    // et gradient non pondéré (critère d'arrêt, en mètres).
    let jtj00 = 0, jtj01 = 0, jtj11 = 0, jtr0 = 0, jtr1 = 0, sq = 0, grad0 = 0, grad1 = 0;
    for (let i = 0; i < local.length; i++) {
      const dx = x - local[i].x;
      const dy = y - local[i].y;
      const r = Math.hypot(dx, dy);
      const w = 1 / Math.max(dists[i], 20);
      const dr = r - dists[i];
      sq += dr * dr;
      if (r > 1e-6) {
        const jx = (dx / r) * w;
        const jy = (dy / r) * w;
        jtj00 += jx * jx; jtj01 += jx * jy; jtj11 += jy * jy;
        jtr0 += jx * dr * w; jtr1 += jy * dr * w;
        grad0 += (dx / r) * dr; grad1 += (dy / r) * dr;
      } else {
        // Point pile sur une ancre : régularise légèrement pour débloquer
        jtj00 += w * w; jtj11 += w * w;
      }
    }
    residualRmsM = Math.sqrt(sq / local.length);
    if (Math.hypot(grad0, grad1) < toleranceM) {
      converged = true;
      break;
    }

    // Équations normales amorties (Levenberg-Marquardt)
    const a00 = jtj00 * (1 + lambda) + 1e-9;
    const a01 = jtj01;
    const a11 = jtj11 * (1 + lambda) + 1e-9;
    const det = a00 * a11 - a01 * a01;
    if (Math.abs(det) < 1e-12) { lambda *= 10; continue; }
    const dx = (-jtr0 * a11 + jtr1 * a01) / det;
    const dy = (-jtr1 * a00 + jtr0 * a01) / det;

    const prevSq = sq;
    const nx = x + dx;
    const ny = y + dy;
    let newSq = 0;
    for (let i = 0; i < local.length; i++) {
      const dr = Math.hypot(nx - local[i].x, ny - local[i].y) - dists[i];
      newSq += dr * dr;
    }
    if (newSq <= prevSq) {
      x = nx; y = ny;
      lambda = Math.max(lambda / 3, 1e-6);
    } else {
      lambda = Math.min(lambda * 5, 1e6);
    }
  }

  const point = offsetMeters(centroid, x, y);

  // Dispersion des ancres (échelle du problème)
  const spreadM = Math.max(
    ...local.map((p) => Math.hypot(p.x, p.y)),
    1,
  );
  // Rayon d'incertitude : résidus RMS + dilution géométrique
  // (ancres resserrées ⇒ incertitude accrue), plancher 25 m.
  const gdop = Math.max(1, spreadM / Math.max(400, spreadM));
  const accuracyRadiusM = Math.max(
    25,
    Math.round(residualRmsM * 2 + 60 * gdop + spreadM * 0.05),
  );

  return {
    point,
    accuracyRadiusM,
    residualRmsM: Math.round(residualRmsM * 10) / 10,
    spreadM: Math.round(spreadM),
    iterations: iterations + 1,
    converged: converged || residualRmsM < 1,
    anchors,
    method: `Trilateration Gauss-Newton (${anchors.length} ancres, ${iterations + 1} itérations)`,
  };
}

/** Générateur pseudo-aléatoire déterministe (mulberry32) — simulations reproductibles. */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CELL_LABELS = ["Antenne A", "Antenne B", "Antenne C", "Antenne D", "Antenne E", "Antenne F"];
const WIFI_LABELS = ["Point Wi-Fi 1", "Point Wi-Fi 2", "Point Wi-Fi 3", "Point Wi-Fi 4", "Point Wi-Fi 5", "Point Wi-Fi 6"];

/**
 * Simule un environnement radio autour d'une position vraie : antennes
 * cellulaires (portée 300 m – 1,5 km) et points Wi-Fi (30 – 200 m).
 * Retourne les ancres avec RSSI et distances bruitées (bruit log-normal).
 */
export function simulateRadioAnchors(
  truePosition: GeoPoint,
  cellTowers: number,
  wifiPoints: number,
  rng: () => number = Math.random,
): RadioAnchor[] {
  const anchors: RadioAnchor[] = [];
  const mk = (kind: "cell" | "wifi", i: number) => {
    const labels = kind === "cell" ? CELL_LABELS : WIFI_LABELS;
    const minR = kind === "cell" ? 250 : 35;
    const maxR = kind === "cell" ? 1400 : 190;
    const r = minR + rng() * (maxR - minR);
    const theta = rng() * Math.PI * 2;
    const pos = offsetMeters(truePosition, r * Math.cos(theta), r * Math.sin(theta));
    const trueDist = haversineMeters(pos, truePosition);
    // Bruit log-normal de mesure (σ ≈ 8 % cell, 12 % Wi-Fi)
    const sigma = kind === "cell" ? 0.08 : 0.12;
    const noisy = trueDist * Math.exp((rng() * 2 - 1) * sigma);
    // RSSI cohérent avec la distance bruitée :
    //  - Wi-Fi : référence -45 dBm à 1 m, n = 2,7
    //  - Cellulaire : référence -75 dBm à 100 m (bilan de liaison macro), n = 3,5
    const rssi =
      kind === "cell"
        ? Math.round(-75 - 35 * Math.log10(Math.max(noisy, 100) / 100))
        : Math.round(-45 - 27 * Math.log10(Math.max(2, noisy)));
    anchors.push({
      id: `${kind}-${i}`,
      kind,
      label: labels[i % labels.length],
      lat: pos.lat,
      lng: pos.lng,
      rssi,
      distanceM: Math.round(noisy),
    });
  };
  for (let i = 0; i < cellTowers; i++) mk("cell", i);
  for (let i = 0; i < wifiPoints; i++) mk("wifi", i);
  return anchors;
}

/**
 * Pipeline complet de triangulation pilote : positionne une cible autour
 * d'une référence (l'appareil a bougé depuis la dernière position connue),
 * génère les ancres, mesure des distances bruitées, résout par moindres carrés.
 */
export function runTriangulation(
  reference: GeoPoint,
  cellTowers: number,
  wifiPoints: number,
  rng: () => number = Math.random,
): TriangulationResult & { truePoint: GeoPoint } {
  // Déplacement plausible depuis la référence : 40 – 350 m
  const moveR = 40 + rng() * 310;
  const moveTheta = rng() * Math.PI * 2;
  const truePoint = offsetMeters(
    reference,
    moveR * Math.cos(moveTheta),
    moveR * Math.sin(moveTheta),
  );
  const anchors = simulateRadioAnchors(truePoint, cellTowers, wifiPoints, rng);
  const result = trilaterate(anchors);
  if (!result) throw new Error("Triangulation impossible : moins de 3 ancres.");
  return { ...result, truePoint };
}
