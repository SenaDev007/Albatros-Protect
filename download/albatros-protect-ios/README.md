# Albatros Protect — Application iOS native (Swift + SwiftUI)

Scaffold natif du pilote **Albatros Protect** (Parakou, Bénin). Conforme au document de
conception UI/UX (palette Noir/Rouge §2, modes clair/sombre §2.3, navigation basse §7.2,
vocabulaire honnête §6.5) et au contrat API REST `/api/v1` partagé avec le portail web.

## Démarrage

```bash
# Ouvrir AlbatrosProtect.xcodeproj (à générer via `swift package generate-xcodeproj`
# ou créer le projet Xcode puis copier les sources), puis :
# - renseigner le baseUrl (AlbatrosProtectApp.swift) ;
# - Phase 2 : clés Google Maps SDK pour iOS restreinte au bundle ID (Info.plist).
```

## Structure

```
AlbatrosProtect/
├── AlbatrosProtectApp.swift   # Point d'entrée + navigation basse (TabView)
├── Theme.swift                # Palette officielle §2.1 + modes clair/sombre
├── Models.swift               # SessionUser, Device, Incident, Observation
├── ApiClient.swift            # URLSession async/await, sessions cookies
└── Views/
    ├── LoginView.swift        # Auth OTP (F-001) — codes jamais réaffichés
    ├── HomeView.swift         # Accueil §7.3 (préparation, appareils, actions)
    ├── DevicesView.swift      # Inventaire, identifiants masqués (F-015)
    ├── MapView.swift          # Carte §6.5 — MapKit + état vide honnête
    └── IncidentWizardView.swift # Signalement §7.5 + step-up F-003
```

## Rappels non négociables

1. **Aucune position fabriquée** — état vide explicite tant qu'aucune observation réelle
   n'existe (§7.9) ; une détection BLE = position du détecteur, jamais un GPS de l'appareil.
2. **Permissions honnêtes** — `NSLocationWhenInUseUsageDescription` rédigée clairement ;
   « Always » seulement avec justification Core Location dédiée ; CoreBluetooth en arrière-plan
   soumis aux modes Apple (btle) — jamais de suivi continu garanti (§10.2 spec).
3. **Aucune caméra** — aucune `NSCameraUsageDescription` : la capture clandestine est exclue (F-026).
4. **Vérification renforcée (F-003)** — le signalement exige un ticket step-up (OTP).

## Étapes suivantes (Phase 2 du CDC)

- Carte : `MapKit` natif (Map component SwiftUI) ou **Google Maps SDK pour iOS** si l'exigence
  Google Maps Platform est confirmée — clé restreinte au bundle ID.
- Localisation : `CLLocationManager`, rythme adaptatif F-036 ; arrière-plan = best effort.
- BLE communautaire : `CBCentralManager`/`CBPeripheralManager`, identifiants rotatifs (§11).
