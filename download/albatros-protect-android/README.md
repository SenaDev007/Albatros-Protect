# Albatros Protect — Application Android native (Kotlin + Jetpack Compose)

Scaffold natif du pilote **Albatros Protect** (Parakou, Bénin). Conforme au document de
conception UI/UX (palette Noir/Rouge §2, vocabulaire honnête §6.5, navigation basse §7.2)
et au contrat API REST `/api/v1` partagé avec le portail web.

## Démarrage

```bash
# Ouvrir dans Android Studio, puis :
./gradlew :app:assembleDebug
# Dans local.properties, pointez l'API du pilote :
# ALBATROS_API_URL="http://10.0.2.2:3000/api/v1"
```

## Structure

```
app/src/main/java/bj/albatrosprotect/
├── MainActivity.kt          # Point d'entrée + navigation Compose
├── core/
│   ├── ApiClient.kt         # Client HTTP typé /api/v1 (sessions cookies)
│   └── Models.kt            # SessionUser, Device, Incident, Observation
└── ui/
    ├── theme/               # Palette officielle §2.1 (clair + sombre)
    └── screens/             # Login OTP, Accueil, Appareils, Carte, Signalement
```

## Rappels de conception non négociables

1. **Aucune position fabriquée** — état vide explicite tant qu'aucune observation réelle
   n'existe (§7.9) ; une détection BLE affiche la position du détecteur, pas un GPS de
   l'appareil (§6.5).
2. **Consentement explicite** — localisation et BLE uniquement après accord explicite ;
   les permissions Android 12+ (`BLUETOOTH_SCAN/ADVERTISE`, `ACCESS_FINE_LOCATION`,
   `BACKGROUND_LOCATION`) se demandent au moment pertinent (F-020), avec justification.
3. **Aucune photo clandestine** (F-026) — le manifeste ne déclare pas la caméra.
4. **Vérification renforcée (F-003)** — le signalement exige un ticket step-up (OTP).

## Étapes suivantes (Phase 2 du CDC)

- Brancher `google_maps_flutter` → **Google Maps SDK pour Android** (clé restreinte au
  package + SHA-1 de signature, jamais dans le code).
- Localisation native : `FusedLocationProviderClient` (Play Services) — rythme adaptatif
  F-036 avec `WorkManager`/service de premier plan et notification visible.
- BLE communautaire : `BluetoothLeScanner`/`BluetoothLeAdvertiser`, scan en arrière-plan
  soumis aux restrictions Android (matrice de test F-046).
- Radio-observations Wi-Fi/cellulaires → backend `/v1/observations/radio` (la clé
  Google Geolocation API reste côté backend, jamais embarquée §7.4).
