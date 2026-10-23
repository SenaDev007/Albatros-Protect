# Agent Albatros — Application mobile (Flutter)

Client mobile du pilote **Agent Albatros** (Cotonou, Bénin) — recherche et récupération
d'appareils perdus ou volés. Ce scaffold implémente le **MVP Phase 1** du cahier des
charges sur la même API REST `/api/v1` que le portail web.

## Démarrage

```bash
flutter pub get
# Démarrez le backend web (Next.js) ou pointez vers votre serveur de pilote,
# puis ajustez le baseUrl dans lib/core/api_client.dart
flutter run
```

## Architecture

```
lib/
├── core/
│   ├── api_client.dart     # Client HTTP typé /api/v1 (même contrat que le web)
│   ├── config.dart         # baseUrl + constantes de couleur
│   └── session_store.dart  # Persistance du cookie de session
├── models/
│   └── models.dart         # SessionUser, Device, Incident, Observation…
├── providers/
│   └── albatros_state.dart # ChangeNotifier : auth, appareils, incidents
├── screens/
│   ├── login_screen.dart       # Auth OTP (F-001) : identifiant → code 6 chiffres
│   ├── home_shell.dart         # Navigation basse (5 onglets)
│   ├── dashboard_screen.dart   # État de préparation + alerte incident
│   ├── devices_screen.dart     # Inventaire privé (identifiants masqués F-015)
│   ├── incident_wizard_screen.dart # Signalement guidé (F-060) + étape step-up (F-003)
│   ├── map_screen.dart         # Carte honnête — sources/heure/précision (§8)
│   └── settings_screen.dart    # Sessions, consentements, droits
└── widgets/
    └── badges.dart          # SourceBadge, StatusBadge, FreshnessTag, HonestyCard
```

## Rappel des principes non négociables (CDC)

1. **Aucune position fabriquée** — l'UI affiche « aucune position disponible » tant
   qu'aucune observation réelle n'existe ; une détection BLE affiche la position du
   téléphone détecteur, jamais un GPS de l'appareil.
2. **Consentement explicite** — collecte de localisation et participation BLE
   uniquement après accord de l'utilisateur (dialogues dédiés dans le wizard
   de préparation à implémenter avec les plugins de permissions).
3. **Aucune photo clandestine** (F-026), aucune promesse de localisation d'un
   appareil éteint (F-022), aucun accès aux réseaux Find My / Find Hub.
4. **Vérification renforcée (F-003)** — les actions sensibles exigent un ticket
   step-up obtenu par OTP.

## Capacités natives à brancher (Phase 2 du CDC)

| Fonction | Plugin recommandé | Notes |
|---|---|---|
| Localisation native | `geolocator` | Permission COARSE/FINE ; rythme adaptatif F-036 |
| BLE communautaire | `flutter_blue_plus` | Scan/advertise selon permissions Android 12+ |
| Géocodage Wi-Fi/cellulaire | Backend `/v1/observations/radio` | La clé Google Geolocation reste côté backend |
| Carte | `google_maps_flutter` | Clés restreintes par bundle ID / signature |
| Notifications sobres | `flutter_local_notifications` | Pas d'identifiant complet sur l'écran verrouillé |

> ⚠️ La spécification recommande Kotlin natif pour Android et Swift pour iOS si les
> contraintes BLE arrière-plan deviennent bloquantes avec Flutter — les plugins
> couvrent le pilote, mais chaque capacité doit être **mesurée par OS** (F-046).
