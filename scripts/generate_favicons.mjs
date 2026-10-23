/**
 * Génération des favicons Albatros Protect avec les outils officiels
 * RealFaviconGenerator (@realfavicongenerator/generate-favicon).
 *
 * Master : scripts/masters/master-shield.png (bouclier + épingle GPS,
 * carré 1024, marges de respiration incluses, fond blanc).
 * Sortie : fichiers directement dans public/ + markups HTML de référence.
 */
import fs from "node:fs/promises";
import path from "node:path";
import rfg from "@realfavicongenerator/generate-favicon";
import { initTransformation } from "@realfavicongenerator/generate-favicon/dist/icon/helper.js";
import { getNodeImageAdapter, loadAndConvertToSvg } from "@realfavicongenerator/image-adapter-node";

const { generateFaviconFiles, generateFaviconHtml, IconTransformationType } = rfg;

const MASTER = "/home/z/my-project/scripts/masters/master-shield.png";
const PUBLIC = "/home/z/my-project/public";
const WORK = "/home/z/my-project/scripts/masters";

async function main() {
  const imageAdapter = await getNodeImageAdapter();
  const svg = await loadAndConvertToSvg(MASTER);

  const settings = {
    icon: {
      desktop: {
        regularIconTransformation: initTransformation(IconTransformationType.None),
        darkIconType: "none",
        darkIconTransformation: initTransformation(IconTransformationType.None),
      },
      touch: {
        appTitle: "Albatros Protect",
        transformation: initTransformation(IconTransformationType.None, {
          imageScale: 1.0,
          backgroundColor: "#ffffff",
          backgroundRadius: 0,
        }),
      },
      webAppManifest: {
        name: "Albatros Protect",
        shortName: "Albatros",
        backgroundColor: "#ffffff",
        themeColor: "#101114",
        transformation: initTransformation(IconTransformationType.None, {
          imageScale: 1.0,
          backgroundColor: "#ffffff",
          backgroundRadius: 0,
        }),
      },
    },
    path: "/",
  };

  console.log("▶ Génération des fichiers favicon…");
  const files = await generateFaviconFiles({ icon: svg }, settings, imageAdapter);

  for (const [fileName, content] of Object.entries(files)) {
    const out = path.join(PUBLIC, fileName);
    if (content instanceof Blob) {
      await fs.writeFile(out, Buffer.from(await content.arrayBuffer()));
    } else {
      await fs.writeFile(out, content, "utf8");
    }
    const kb = ((content instanceof Blob ? content.size : Buffer.byteLength(String(content))) / 1024).toFixed(1);
    console.log(`  ✓ public/${fileName} (${kb} Ko)`);
  }

  const markups = generateFaviconHtml(settings);
  await fs.writeFile(
    path.join(WORK, "favicon-markups.json"),
    JSON.stringify(markups, null, 2),
    "utf8",
  );
  console.log("\n▶ Markups HTML de référence (à transposer dans l'API Metadata de Next.js) :");
  for (const m of markups.markups) console.log("  " + m);
}

main().catch((err) => {
  console.error("Échec de la génération :", err);
  process.exit(1);
});
