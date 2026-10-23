// Albatros Protect — palette officielle (§2.1) et modes clair/sombre (§2.3)
import SwiftUI

extension Color {
    // Noir
    static let noirPrincipal = Color(hex: 0x101114)
    static let noirSecondaire = Color(hex: 0x191A1F)

    // Rouge protecteur
    static let rougePrincipal = Color(hex: 0xE53945)
    static let rougeFonce = Color(hex: 0xB91F2B)
    static let rougeClair = Color(hex: 0xFFF0F1)

    // Neutres
    static let blanc = Color(hex: 0xFFFFFF)
    static let grisClair = Color(hex: 0xF4F4F6)
    static let grisMoyen = Color(hex: 0x777982)
    static let grisFonce = Color(hex: 0x34363D)
    static let bordure = Color(hex: 0xE3E4E8)

    // Sources d'observation (§6.5)
    static let sourceNative = rougePrincipal        // Position reçue de l'appareil
    static let sourceEstimation = Color(hex: 0xF59E0B) // Estimation Wi-Fi/cellulaire
    static let sourceBle = Color(hex: 0x8B5CF6)     // Détection Bluetooth à proximité
    static let sourcePartenaire = Color(hex: 0x14B8A6) // Partenaire autorisé

    init(hex: UInt32) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 8) & 0xFF) / 255,
            blue: Double(hex & 0xFF) / 255
        )
    }
}

/// Thème Albatros : les deux modes sont adaptés séparément (§2.3), jamais une inversion brute.
struct AlbatrosColors {
    @Environment(\.colorScheme) static func current(_ scheme: ColorScheme) -> AlbatrosColors {
        AlbatrosColors(
            background: scheme == .dark ? .noirPrincipal : .grisClair,
            card: scheme == .dark ? .noirSecondaire : .blanc,
            text: scheme == .dark ? .blanc : .noirPrincipal,
            secondaryText: scheme == .dark ? Color(hex: 0xB8BAC3) : .grisMoyen,
            border: scheme == .dark ? Color(hex: 0x26282F) : .bordure,
            accent: .rougePrincipal
        )
    }
    let background: Color
    let card: Color
    let text: Color
    let secondaryText: Color
    let border: Color
    let accent: Color
}
