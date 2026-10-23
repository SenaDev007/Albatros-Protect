import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'
import dns from 'node:dns'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

/**
 * Résolution de l'URL de la base de données.
 *
 * Priorité :
 * 1. DATABASE_URL postgresql://… défini dans l'environnement (Vercel, prod).
 * 2. DATABASE_URL postgresql://… lu directement dans .env — le sandbox de dev
 *    injecte DATABASE_URL=file:…custom.db en variable d'environnement qui écrase
 *    le fichier .env ; on lit donc le fichier explicitement pour honorer la
 *    configuration Neon PostgreSQL du projet.
 * 3. SQLite local (file:…) pour un démarrage hors ligne.
 * 4. Serverless Vercel sans URL externe : copie de la base de démarrage vers /tmp.
 *
 * Le client utilise l'adaptateur driver-adapter `pg` (PrismaPg), avec DNS
 * IPv4 d'abord : le hostname Neon expose des enregistrements AAAA non routés
 * dans certains environnements (sandbox), tandis que SNI doit rester le vrai
 * hostname pour le routage Neon.
 */

function readEnvFileDatabaseUrl(): string | null {
  try {
    const envPath = path.join(process.cwd(), '.env')
    if (!fs.existsSync(envPath)) return null
    const m = fs.readFileSync(envPath, 'utf8').match(/^DATABASE_URL="?([^"\r\n]+)"?\s*$/m)
    return m?.[1] ?? null
  } catch {
    return null
  }
}

function resolveDatabaseUrl(): { url: string; kind: 'postgres' | 'file' } {
  const configured = process.env.DATABASE_URL

  // 1. URL PostgreSQL explicite dans l'environnement → prioritaire.
  if (configured && configured.startsWith('postgres')) {
    return { url: configured, kind: 'postgres' }
  }

  // 2. URL PostgreSQL posée dans .env (le sandbox écrase l'env avec file:…).
  const fromFile = readEnvFileDatabaseUrl()
  if (fromFile && fromFile.startsWith('postgres')) {
    return { url: fromFile, kind: 'postgres' }
  }

  // 3/4. SQLite local ou bootstrap /tmp Vercel.
  if (process.env.VERCEL && (!configured || configured.startsWith('file:'))) {
    const target = '/tmp/albatros.db'
    if (!fs.existsSync(target)) {
      const source = path.join(process.cwd(), 'db', 'custom.db')
      try {
        fs.copyFileSync(source, target)
      } catch (err) {
        console.error('[db] Impossible de copier la base de démarrage vers /tmp :', err)
      }
    }
    return { url: 'file:' + target, kind: 'file' }
  }

  return { url: configured || 'file:./db/custom.db', kind: 'file' }
}

function createPrismaClient(): PrismaClient {
  const { url, kind } = resolveDatabaseUrl()

  if (kind === 'postgres') {
    // IPv4 d'abord : certains réseaux (sandbox) n'acheminent pas l'IPv6 de Neon.
    dns.setDefaultResultOrder('ipv4first')
    const pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 15_000,
    })
    return new PrismaClient({
      adapter: new PrismaPg(pool),
      log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
    })
  }

  return new PrismaClient({
    datasources: { db: { url } },
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
  })
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
