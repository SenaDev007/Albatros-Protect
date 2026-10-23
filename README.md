# Agent Albatros — Albatros Protect 🛡️

Plateforme pilote de protection et de localisation d'appareils (smartphones, tablettes, ordinateurs) contre le vol et la perte, pensée pour le Bénin et l'Afrique de l'Ouest : déclaration d'incident assistée, transmission aux opérateurs (MTN Bénin, Moov Africa Bénin, Celtiis) et aux autorités, cercles de confiance, gouvernance des consentements et protection de la vie privée (identifiants masqués, purge des observations radio, journal d'audit).

Identité visuelle : noir & rouge (dark premium), unicité du service par identifiant opaque — l'IMEI n'est jamais exposé en clair.

## Contenu du dépôt

| Dossier | Description |
|---|---|
| `src/` | **Application Web** — Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Prisma |
| `src/app/api/v1/` | **API REST** partagée : auth OTP, appareils, incidents, observations (localisation/radio/BLE), cercles, consentements, partages, audit, console opérateur |
| `prisma/` | Schéma de données Prisma (SQLite en pilote) |
| `db/custom.db` | Base SQLite de démarrage (schéma + données de démonstration) |
| `public/` | **Identité visuelle** : favicons officiels (générés par RealFaviconGenerator depuis le logo bouclier GPS — `favicon.ico`, `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192/512.png`, `site.webmanifest`), `og-image.png` (partage social 1200×630), logos sources (`Logo Albatros Protect en vol.png`, `Albatros aérien et bouclier GPS glossy.png`), `brand/` (assets optimisés pour l'UI) |
| `download/albatros-protect-android/` | **App native Android** (Kotlin + Jetpack Compose), icônes launcher `res/mipmap-*` |
| `download/albatros-protect-ios/` | **App native iOS** (Swift + SwiftUI) |
| `download/*.zip` | Archives des deux apps mobiles |

## Démarrage local

Prérequis : [Bun](https://bun.sh) (ou Node 20+ / npm).

```bash
bun install                # installe les dépendances (+ prisma generate)
cp .env.example .env       # DATABASE_URL=file:./db/custom.db
bun run db:push            # applique le schéma à la base SQLite
bun run dev                # http://localhost:3000
```

Build de production local (sortie standalone) :

```bash
bun run build
bun run start
```

## Déploiement sur Vercel

Le projet est **prêt pour Vercel, sans configuration requise** :

1. Importer ce dépôt sur [vercel.com/new](https://vercel.com/new) (Framework : **Next.js** — détecté automatiquement).
2. Aucune variable d'environnement n'est nécessaire au démarrage : sur l'environnement serverless, `src/lib/db.ts` copie automatiquement la base SQLite de démarrage vers `/tmp` (seul répertoire inscriptible) lors du premier démarrage de chaque instance.
3. Déployer. Les routes `/api/v1/**` sont servies par les fonctions serverless Node.js.

### ⚠️ Limites du mode pilote (SQLite éphémère)

Sur l'infra serverless, chaque instance de fonction possède son propre `/tmp` : les écritures (comptes créés, incidents déclarés) **ne persistent pas entre les instances**. Convient à une démonstration ; pour la production :

- **Turso** (libSQL, extension SQLite) : migration minimale depuis le schéma actuel ;
- **Neon** ou **Supabase** (PostgreSQL managé) : changer `provider = "sqlite"` en `"postgresql"` dans `prisma/schema.prisma` puis `prisma db push` ;
- puis définir `DATABASE_URL` dans les variables d'environnement du projet Vercel — le code l'utilisera telle quelle.

### Structure de l'API (résumé)

```
POST   /api/v1/auth/otp/start|verify      Connexion par code OTP (pilote : code renvoyé dans la réponse)
GET    /api/v1/auth/session               Session courante
GET    /api/v1/devices                    Appareils de l'utilisateur
POST   /api/v1/incidents                  Déclaration d'incident (perte / vol)
GET    /api/v1/incidents/:id/map          Observations de localisation rattachées
POST   /api/v1/incidents/:id/partner-requests  Demandes aux opérateurs / autorités
POST   /api/v1/observations/location|radio|ble  Remontées d'observations
GET    /api/v1/circles                    Cercles de confiance
GET    /api/v1/consents                   Consentements (RGPD-like)
GET    /api/v1/console/stats              Console support / opérateur
GET    /api/v1/audit                      Journal d'audit
```

## Spécifications sources

- `upload/Cahier_des_charges_fonctionnel__Agent_Albatros.md` — cahier des charges fonctionnel
- `upload/Spcification_technique__Agent_Albatros.md` — spécification technique

## Applications mobiles natives

- **Android** (`download/albatros-protect-android/`) : ouvrir le dossier dans Android Studio, synchroniser Gradle, puis exécuter sur un émulateur ou un appareil. L'URL de l'API est configurable dans `core/ApiClient.kt`.
- **iOS** (`download/albatros-protect-ios/`) : ouvrir `AlbatrosProtect` dans Xcode, puis exécuter sur un simulateur. L'URL de l'API est configurable dans `ApiClient.swift`.

Les deux apps consomment la même API REST `/api/v1` que l'application Web.
