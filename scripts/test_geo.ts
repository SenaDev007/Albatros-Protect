/**
 * Tests unitaires du moteur de triangulation (src/lib/geo.ts).
 * Usage : bun scripts/test_geo.ts
 */
import {
  haversineMeters, offsetMeters, rssiToDistanceMeters, trilaterate,
  simulateRadioAnchors, runTriangulation, seededRng,
} from "../src/lib/geo";

let passed = 0, failed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, extra = "") {
  if (cond) { passed++; console.log(`  ✅ ${name}`); }
  else { failed++; failures.push(name); console.log(`  ❌ ${name} ${extra}`); }
}

const PARAKOU = { lat: 9.3433, lng: 2.6089 };

console.log("══════════════════════════════════════════════════");
console.log("  TESTS MOTEUR DE TRIANGULATION — src/lib/geo.ts");
console.log("══════════════════════════════════════════════════");

// ── 1. Haversine ──
console.log("\n📏 Distances (haversine)");
const d0 = haversineMeters(PARAKOU, PARAKOU);
check("Point à lui-même = 0 m", d0 < 0.001);
const d1 = haversineMeters(PARAKOU, offsetMeters(PARAKOU, 1000, 0));
check("1 km vers l'est ≈ 1000 m", Math.abs(d1 - 1000) < 3, `reçu ${d1.toFixed(1)} m`);
const d2 = haversineMeters(PARAKOU, offsetMeters(PARAKOU, 0, 5000));
check("5 km vers le nord ≈ 5000 m", Math.abs(d2 - 5000) < 3, `reçu ${d2.toFixed(1)} m`);

// ── 2. RSSI → distance ──
console.log("\n📶 RSSI → distance");
check("-45 dBm ≈ saturation 2 m (référence Wi-Fi)", rssiToDistanceMeters(-45) <= 2.01);
check("-85 dBm ≈ 24 m (Wi-Fi n=2.7)", rssiToDistanceMeters(-85) > 15 && rssiToDistanceMeters(-85) < 40, `${rssiToDistanceMeters(-85).toFixed(1)} m`);
check("Saturation basse 2 m", rssiToDistanceMeters(10) <= 2.01);
check("Saturation haute 2000 m", rssiToDistanceMeters(-160) >= 1999);

// ── 3. Trilateration exacte (parfaites distances) ──
console.log("\n🎯 Trilateration — distances exactes");
const target = offsetMeters(PARAKOU, 220, -140);
const exactAnchors = [
  { id: "a", kind: "cell" as const, label: "A", ...offsetMeters(PARAKOU, 800, 400), distanceM: 0 },
  { id: "b", kind: "cell" as const, label: "B", ...offsetMeters(PARAKOU, -700, 350), distanceM: 0 },
  { id: "c", kind: "cell" as const, label: "C", ...offsetMeters(PARAKOU, 100, -900), distanceM: 0 },
].map((a) => ({ ...a, distanceM: haversineMeters({ lat: a.lat, lng: a.lng }, target) }));
const res = trilaterate(exactAnchors)!;
const errExact = haversineMeters(res.point, target);
check("Convergence avec distances exactes", res.converged);
check("Erreur < 2 m (cas parfait)", errExact < 2, `erreur ${errExact.toFixed(2)} m`);
check("Résidu RMS quasi nul", res.residualRmsM < 1, `${res.residualRmsM} m`);

// ── 4. Trilateration bruitée (réaliste) ──
console.log("\n📡 Trilateration — distances bruitées (σ 8–12 %)");
let totalErr = 0, n = 0, worst = 0;
const rng = seededRng(20261023);
for (let t = 0; t < 200; t++) {
  const moveR = 40 + rng() * 310;
  const th = rng() * Math.PI * 2;
  const truth = offsetMeters(PARAKOU, moveR * Math.cos(th), moveR * Math.sin(th));
  const anchors = simulateRadioAnchors(truth, 3 + Math.floor(rng() * 3), 3 + Math.floor(rng() * 5), rng);
  const r = trilaterate(anchors);
  if (!r) { check("Résolution possible (≥ 3 ancres)", false); continue; }
  const e = haversineMeters(r.point, truth);
  totalErr += e; n++; worst = Math.max(worst, e);
}
const meanErr = totalErr / n;
check("200 résolutions convergées", n === 200);
check(`Erreur moyenne < 90 m (reçu ${meanErr.toFixed(0)} m)`, meanErr < 90);
check(`Pire erreur < 400 m (reçu ${worst.toFixed(0)} m)`, worst < 400);
console.log(`  → erreur moyenne ${meanErr.toFixed(1)} m · pire ${worst.toFixed(1)} m`);

// ── 5. Pipeline complet (runTriangulation) ──
console.log("\n🔁 Pipeline complet runTriangulation");
const run = runTriangulation(PARAKOU, 3, 5, seededRng(42));
const runErr = haversineMeters(run.point, run.truePoint);
check("Résultat exploitable (erreur < 200 m)", runErr < 200, `${runErr.toFixed(1)} m`);
check("Rayon d'incertitude cohérent (25–800 m)", run.accuracyRadiusM >= 25 && run.accuracyRadiusM <= 800, `${run.accuracyRadiusM} m`);
check("Rayon couvre l'erreur réelle", run.accuracyRadiusM >= runErr * 0.6, `rayon ${run.accuracyRadiusM} vs erreur ${runErr.toFixed(0)}`);
check("Ancres décrites avec RSSI + distance", run.anchors.every((a) => typeof a.rssi === "number" && a.distanceM > 0));
check("Méthode documentée", run.method.includes("Gauss-Newton"));

// ── 6. Cas dégénérés ──
console.log("\n⚠️ Cas dégénérés");
check("2 ancres → null (impossible)", trilaterate(exactAnchors.slice(0, 2)) === null);
const farAnchors = simulateRadioAnchors(offsetMeters(PARAKOU, 5000, 5000), 4, 4, seededRng(7));
const rFar = trilaterate(farAnchors);
check("Ancres lointaines : rayon d'incertitude élargi", !rFar || rFar.accuracyRadiusM >= 100, rFar ? `${rFar.accuracyRadiusM} m` : "null");

console.log("\n══════════════════════════════════════════════════");
console.log(`  RÉSULTAT : ${passed} OK / ${failed} ÉCHEC(S)`);
if (failures.length) console.log("  Échecs :", failures.join(" · "));
console.log("══════════════════════════════════════════════════");
process.exit(failed ? 1 : 0);
