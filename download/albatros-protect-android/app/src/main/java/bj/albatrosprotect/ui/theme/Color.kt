// Albatros Protect — palette officielle (§2.1 du document de conception)
package bj.albatrosprotect.ui.theme

import androidx.compose.ui.graphics.Color

// Noir
val NoirPrincipal = Color(0xFF101114)
val NoirSecondaire = Color(0xFF191A1F)

// Rouge protecteur
val RougePrincipal = Color(0xFFE53945)
val RougeFonce = Color(0xFFB91F2B)
val RougeClair = Color(0xFFFFF0F1)

// Neutres
val Blanc = Color(0xFFFFFFFF)
val GrisClair = Color(0xFFF4F4F6)
val GrisMoyen = Color(0xFF777982)
val GrisFonce = Color(0xFF34363D)
val Bordure = Color(0xFFE3E4E8)

// Sources d'observation (§6.5 — couleurs distinctes, jamais confondues)
val SourceNative = RougePrincipal          // Position reçue de l'appareil
val SourceEstimation = Color(0xFFF59E0B)   // Estimation Wi-Fi/cellulaire
val SourceBle = Color(0xFF8B5CF6)           // Détection Bluetooth à proximité
val SourcePartenaire = Color(0xFF14B8A6)    // Position communiquée par un partenaire autorisé

// Statuts (§5.4 — vert confirmé, orange action requise, rouge critique, gris neutre, bleu info)
val StatutSucces = Color(0xFF16A34A)
val StatutAlerte = Color(0xFFF59E0B)
val StatutCritique = RougeFonce
val StatutInfo = Color(0xFF2563EB)
