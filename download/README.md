# Livrables Albatros Protect

**Plateforme pilote (Parakou, Bénin) — Protéger. Localiser. Récupérer.**

| Livrable | Contenu |
|---|---|
| `albatros-protect-android.zip` | Scaffold Android natif **Kotlin + Jetpack Compose** : palette officielle §2.1, modes clair/sombre, client API `/api/v1`, écrans Login OTP / Accueil / Appareils / Carte / Signalement, manifest honnête (pas de caméra, permissions commentées F-020), **icônes launcher bouclier GPS** (`res/mipmap-*`) |
| `albatros-protect-ios.zip` | Scaffold iOS natif **Swift + SwiftUI** : mêmes principes — palette, thème adaptatif, ApiClient async/await, LoginView, HomeView, DevicesView, MapView (état vide honnête), IncidentWizardView + step-up F-003, Info.plist (permissions honnêtes), **AppIcon 1024×1024** (`Assets.xcassets/AppIcon.appiconset`) |
| `protect-landing-dark.png` | Page publique — mode sombre (noir #101114 / rouge #E53945) |
| `protect-dashboard-light.png` | Tableau de bord citoyen §6.3 — mode clair (#F4F4F6) |
| `protect-carte-light.png` | Carte et observations — sources différenciées, rayon de précision, légende |

> Le **portail web** (Next.js) tourne dans l'aperçu : comptes, inventaire, préparation,
> signalements, carte honnête, cercles de confiance, démarches, notifications, centre
> d'aide, console opérationnelle — avec vérification renforcée F-003 sur les actions sensibles.

**Compte de démonstration :** `+22997000001` — le code OTP s'affiche à l'écran (mode pilote).
