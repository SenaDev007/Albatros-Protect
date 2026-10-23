/**
 * Albatros Protect — db-push pour Neon PostgreSQL depuis ce sandbox.
 *
 * Le moteur Rust de la CLI Prisma résout le hostname Neon en IPv6 d'abord
 * (ECONNREFUSED dans le sandbox), donc `prisma db push` classique échoue.
 * Ce script :
 *   1. génère le DDL hors-ligne (`prisma migrate diff`, aucune connexion),
 *   2. l'exécute via l'adaptateur `pg` (DNS IPv4-first, SNI préservé).
 *
 * Usage : bun scripts/db_push_neon.ts [--force]
 */
import { execSync } from "node:child_process";
import dns from "node:dns";
import fs from "node:fs";
import path from "node:path";

dns.setDefaultResultOrder("ipv4first");

const ROOT = path.resolve(import.meta.dir, "..");
const SNAPSHOT = path.join(ROOT, "prisma", ".schema-applied.prisma");

function resolveUrl(): string {
  const envUrl = process.env.DATABASE_URL;
  if (envUrl && envUrl.startsWith("postgres")) return envUrl;
  const envFile = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = envFile.match(/^DATABASE_URL="?([^"\n]+)"?$/m);
  if (m && m[1].startsWith("postgres")) return m[1];
  throw new Error("Aucune URL postgresql trouvée (.env ou DATABASE_URL)");
}

async function main() {
  const url = resolveUrl();
  const force = process.argv.includes("--force");
  const schemaPath = path.join(ROOT, "prisma", "schema.prisma");

  // 1. Base de référence : snapshot appliqué (ou vide au premier passage)
  const fromEmpty = !fs.existsSync(SNAPSHOT);
  if (!fromEmpty && !force) {
    const identical =
      fs.readFileSync(SNAPSHOT, "utf8").trim() === fs.readFileSync(schemaPath, "utf8").trim();
    if (identical) {
      console.log("✅ Schéma déjà à jour (snapshot identique). Rien à faire.");
      return;
    }
  }

  // 2. DDL hors-ligne via prisma migrate diff
  const fromArgs = fromEmpty
    ? ["--from-empty"]
    : ["--from-schema-datamodel", SNAPSHOT];
  const cmd = `bunx prisma migrate diff ${fromArgs.join(" ")} --to-schema-datamodel ${schemaPath} --script`;
  console.log("🔧 Génération du DDL :", fromEmpty ? "depuis zéro" : "différentiel");
  const sql = execSync(cmd, { cwd: ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  if (!sql.trim()) {
    console.log("✅ Aucune différence détectée. Rien à faire.");
    fs.copyFileSync(schemaPath, SNAPSHOT);
    return;
  }
  console.log("--- DDL généré (extrait) ---");
  console.log(sql.split("\n").slice(0, 8).join("\n"), "\n[…]\n");

  // 3. Exécution via pg
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url, max: 1 });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("✅ DDL appliqué à Neon PostgreSQL.");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("❌ Échec DDL :", (e as Error).message);
    process.exitCode = 1;
    return;
  } finally {
    client.release();
    await pool.end();
  }

  // 4. Snapshot
  fs.copyFileSync(schemaPath, SNAPSHOT);
  console.log("📝 Snapshot enregistré :", SNAPSHOT);
}

main();
