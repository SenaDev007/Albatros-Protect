# Agent Albatros — Albatros Protect 🛡️

Plateforme pilote de protection et de localisation d'appareils (smartphones, tablettes, ordinateurs) contre le vol et la perte, pensée pour le Bénin et l'Afrique de l'Ouest : déclaration d'incident assistée, transmission aux opérateurs (MTN Bénin, Moov Africa Bénin, Celtiis) et aux autorités, cercles de confiance, gouvernance des consentements et protection de la vie privée (identifiants masqués, purge des observations radio, journal d'audit).

Identité visuelle : noir & rouge (dark premium), unicité du service par identifiant opaque — l'IMEI n'est jamais exposé en clair.

## Contenu du dépôt

| Dossier | Description |
|---|---|
| `src/` | **Application Web** — Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Prisma |
| `src/app/api/v1/` | **API REST** partagée : auth OTP, appareils, incidents, observations (localisation/radio/BLE), cercles, consentements, partages, audit, console opérateur |
| `prisma/` | Schéma de données Prisma (**PostgreSQL Neon** — persistance réelle) |
| `db/custom.db` | Base SQLite de repli hors ligne (mode dégradé) |
| `src/lib/geo.ts` | **Moteur de triangulation** — trilatération Gauss-Newton (RSSI → distances, résidus, rayon d'incertitude) |
| `src/app/api/v1/backoffice/` | **API back-office 3 espaces** : Système, GSM (opérateurs), Police (autorités) |
| `public/` | **Identité visuelle** : favicons officiels (générés par RealFaviconGenerator depuis le logo bouclier GPS — `favicon.ico`, `favicon.svg`, `favicon-96x96.png`, `apple-touch-icon.png`, `web-app-manifest-192/512.png`, `site.webmanifest`), `og-image.png` (partage social 1200×630), logos sources (`Logo Albatros Protect en vol.png`, `Albatros aérien et bouclier GPS glossy.png`), `brand/` (assets optimisés pour l'UI) |
| `download/albatros-protect-android/` | **App native Android** (Kotlin + Jetpack Compose), icônes launcher `res/mipmap-*` |
| `download/albatros-protect-ios/` | **App native iOS** (Swift + SwiftUI) |
| `download/*.zip` | Archives des deux apps mobiles |

## Démarrage local

Prérequis : [Bun](https://bun.sh) (ou Node 20+ / npm).

```bash
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
> l'exécute via `pg`).

Build de production local (sortie standalone) :

```bash
bun run build
bun run start
```

## Déploiement sur Vercel

Le projet est **prêt pour Vercel, sans configuration requise** :

1. Importer ce dépôt sur [vercel.com/new](https://vercel.com/new) (Framework : **Next.js** — détecté automatiquement).
2. Définir `DATABASE_URL` (PostgreSQL Neon) dans les variables d'environnement du projet — **persistance réelle** : toutes les instances serverless partagent la même base.
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
« partenaire autorisé » via le même moteur.

### Structure de l'API (résumé)

```
POST   /api/v1/auth/otp/start|verify      Connexion par code OTP (pilote : code renvoyé dans la réponse)
GET    /api/v1/auth/session               Session courante
GET    /api/v1/devices                    Appareils de l'utilisateur
POST   /api/v1/incidents                  Déclaration d'incident (perte / vol)
GET    /api/v1/incidents/:id/map          Observations de localisation rattachées
POST   /api/v1/incidents/:id/partner-requests  Demandes aux opérateurs / autorités
POST   /api/v1/observations/location|radio|ble  Remontées d'observations (radio = triangulation Gauss-Newton)
GET    /api/v1/circles                    Cercles de confiance
GET    /api/v1/consents                   Consentements (RGPD-like)
GET    /api/v1/console/stats              Console support / opérateur
GET    /api/v1/audit                      Journal d'audit

# Back-office — 3 espaces (rôles dédiés requis)
GET    /api/v1/backoffice/session                Espaces accessibles selon le rôle
GET    /api/v1/backoffice/stats?space=…          KPI par espace (system | gsm | police)
GET    /api/v1/backoffice/users                  Annuaire des comptes (Système)
PATCH  /api/v1/backoffice/users/:id              Gestion des rôles (admin)
GET    /api/v1/backoffice/incidents?space=…      Supervision des dossiers (Système, Police)
PATCH  /api/v1/backoffice/incidents/:id          Transitions de statut + plaintes (Police)
GET    /api/v1/backoffice/partner-requests       File SIM/IMEI/localisation (GSM, Police)
PATCH  /api/v1/backoffice/partner-requests/:id   Traiter / transmettre / refuser (+ position réseau)
POST   /api/v1/backoffice/triangulation          Localisation réseau autorisée (GSM)
GET    /api/v1/backoffice/audit                  Journal d'audit consolidé (Système)
GET    /api/v1/backoffice/privacy-requests       Demandes RGPD (Système)
PATCH  /api/v1/backoffice/privacy-requests/:id   Traitement RGPD
```

## Spécifications sources

- `upload/Cahier_des_charges_fonctionnel__Agent_Albatros.md` — cahier des charges fonctionnel
- `upload/Spcification_technique__Agent_Albatros.md` — spécification technique

## Applications mobiles natives

- **Android** (`download/albatros-protect-android/`) : ouvrir le dossier dans Android Studio, synchroniser Gradle, puis exécuter sur un émulateur ou un appareil. L'URL de l'API est configurable dans `core/ApiClient.kt`.
- **iOS** (`download/albatros-protect-ios/`) : ouvrir `AlbatrosProtect` dans Xcode, puis exécuter sur un simulateur. L'URL de l'API est configurable dans `ApiClient.swift`.

Les deux apps consomment la même API REST `/api/v1` que l'application Web.
