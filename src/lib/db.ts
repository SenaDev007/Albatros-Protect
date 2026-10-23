import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

/**
 * Résolution de l'URL de la base de données (Prisma / SQLite).
 *
 * - Local : DATABASE_URL du fichier .env (ex. file:./db/custom.db).
 * - Vercel (serverless) : le système de fichiers est en lecture seule sauf /tmp.
 *   La base SQLite de démarrage (db/custom.db, embarquée dans la fonction via
 *   outputFileTracingIncludes) est copiée vers /tmp au premier démarrage de
 *   chaque instance — zéro configuration d'environnement requise.
 * - Production réelle : définir DATABASE_URL vers une base hébergée
 *   (Turso, Neon, Supabase…) pour une persistance durable — voir README.md.
 */
function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL

  // Une URL externe (hébergée) ou locale explicite prime toujours.
  if (configured && !configured.startsWith('file:/tmp/')) {
    return configured
  }

  // Serverless Vercel : copie ponctuelle de la base de démarrage vers /tmp.
  if (process.env.VERCEL) {
    const target = '/tmp/albatros.db'
    if (!fs.existsSync(target)) {
      const source = path.join(process.cwd(), 'db', 'custom.db')
      try {
        fs.copyFileSync(source, target)
      } catch (err) {
        console.error('[db] Impossible de copier la base de démarrage vers /tmp :', err)
      }
    }
    return 'file:' + target
  }

  return configured || 'file:./db/custom.db'
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: { db: { url: resolveDatabaseUrl() } },
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
