#!/usr/bin/env python3
"""Mise à jour du README : PostgreSQL Neon + back-office + triangulation."""
s = open("README.md").read()

# 1. Table of contents
old_table = "| `prisma/` | Schéma de données Prisma (SQLite en pilote) |\n| `db/custom.db` | Base SQLite de démarrage (schéma + données de démonstration) |"
new_table = ("| `prisma/` | Schéma de données Prisma (**PostgreSQL Neon** — persistance réelle) |\n"
             "| `db/custom.db` | Base SQLite de repli hors ligne (mode dégradé) |\n"
             "| `src/lib/geo.ts` | **Moteur de triangulation** — trilatération Gauss-Newton (RSSI → distances, résidus, rayon d'incertitude) |\n"
             "| `src/app/api/v1/backoffice/` | **API back-office 3 espaces** : Système, GSM (opérateurs), Police (autorités) |")
assert old_table in s, "table introuvable"
s = s.replace(old_table, new_table)

# 2. Local startup
old_start = """```bash
bun install                # installe les dépendances (+ prisma generate)
cp .env.example .env       # DATABASE_URL=file:./db/custom.db
bun run db:push            # applique le schéma à la base SQLite
bun run dev                # http://localhost:3000
```"""
new_start = """```bash
bun install                # installe les dépendances (+ prisma generate)
cp .env.example .env       # DATABASE_URL → PostgreSQL Neon (chaîne fournie)
bun prisma/seed.ts         # (optionnel) données de démonstration Parakou
bun run dev                # http://localhost:3000
```

> **PostgreSQL Neon** : la base `Albatros Protect` (Neon, eu-central-1) héberge les 18 tables
> du schéma — toutes les écritures sont **persistées durablement**. Le client Prisma passe par
> l'adaptateur driver-adapter `pg` avec DNS IPv4-first (l'IPv6 de Neon n'est pas routé dans
> certains réseaux). Pour appliquer une évolution du schéma depuis cet environnement :
> `bun scripts/db_push_neon.ts` (génère le DDL hors-ligne via `prisma migrate diff`, puis
> l'exécute via `pg`)."""
assert old_start in s, "startup introuvable"
s = s.replace(old_start, new_start)

# 3. Vercel section
old_vercel = """2. Aucune variable d'environnement n'est nécessaire au démarrage : sur l'environnement serverless, `src/lib/db.ts` copie automatiquement la base SQLite de démarrage vers `/tmp` (seul répertoire inscriptible) lors du premier démarrage de chaque instance.
3. Déployer. Les routes `/api/v1/**` sont servies par les fonctions serverless Node.js.

### ⚠️ Limites du mode pilote (SQLite éphémère)

Sur l'infra serverless, chaque instance de fonction possède son propre `/tmp` : les écritures (comptes créés, incidents déclarés) **ne persistent pas entre les instances**. Convient à une démonstration ; pour la production :

- **Turso** (libSQL, extension SQLite) : migration minimale depuis le schéma actuel ;
- **Neon** ou **Supabase** (PostgreSQL managé) : changer `provider = "sqlite"` en `"postgresql"` dans `prisma/schema.prisma` puis `prisma db push` ;
- puis définir `DATABASE_URL` dans les variables d'environnement du projet Vercel — le code l'utilisera telle quelle."""
new_vercel = """2. Définir `DATABASE_URL` (PostgreSQL Neon) dans les variables d'environnement du projet — **persistance réelle** : toutes les instances serverless partagent la même base.
3. Déployer. Les routes `/api/v1/**` sont servies par les fonctions serverless Node.js.

### Base de données — PostgreSQL Neon (persistance réelle)

Le schéma est passé de SQLite (pilote éphémère) à **PostgreSQL managé (Neon)** : comptes,
appareils, incidents, observations, demandes partenaires, journal d'audit et données du
back-office sont **persistés durablement**. La chaîne de connexion utilise l'endpoint pooler
(PgBouncer, transaction mode — adaptateur `pg`). Un repli SQLite reste disponible en mode
dégradé hors ligne (`db/custom.db`).

### Back-office — trois espaces distincts (`#/back-office/<espace>`)

| Espace | Rôles autorisés | Fonctions |
|---|---|---|
| **Système** (`#/back-office/systeme`) | `admin`, `support` | KPI plateforme, annuaire des comptes et gestion des rôles, supervision de tous les dossiers, journal d'audit consolidé, traitement des demandes RGPD |
| **GSM** (`#/back-office/gsm`) | `gsm_operator`, `admin` | File des demandes opérateurs (suspension SIM, blocage IMEI, localisation réseau), **triangulation réseau** (moteur Gauss-Newton) avec carte des ancres, réponses notifiées dans la chronologie du propriétaire |
| **Police** (`#/back-office/police`) | `police_officer`, `admin` | Dossiers de vol, enregistrement des références de plainte, transitions de statut (transmis / en enquête / clôturé), demandes IMEI aux autorités |

Comptes de démonstration (OTP affiché à l'écran) :
`admin@albatros.bj` (Système) · `gsm.mtn@albatros.bj` (GSM — MTN Bénin) ·
`police.parakou@albatros.bj` (Police — Parakou) · `+22997000001` (citoyenne Awa Hounsou).

### Triangulation Wi-Fi/cellulaire (moteur `src/lib/geo.ts`)

Les estimations radio ne sont plus aléatoires : le serveur exécute une **trilatération par
moindres carrés** (Gauss-Newton amorti) sur les distances déduites des RSSI (modèle
log-distance : Wi-Fi n=2,7 ; cellulaire n=3,5), avec rayon d'incertitude issu des résidus
réels — jamais de position fabriquée. La carte citoyen affiche le tracé complet (ancres,
cercles de portée pointillés, position ± rayon) et l'espace GSM peut produire des positions
« partenaire autorisé » via le même moteur."""
assert old_vercel in s, "vercel introuvable"
s = s.replace(old_vercel, new_vercel)

open("README.md", "w").write(s)
print("README mis à jour ✓")
