// Albatros Protect — point d'entrée + navigation basse §7.2
import SwiftUI

@main
struct AlbatrosProtectApp: App {
    @StateObject private var api = ApiClient.shared

    var body: some Scene {
        WindowGroup {
            Group {
                if api.user == nil {
                    LoginView()
                } else {
                    MainTabView()
                }
            }
            .tint(.rougePrincipal)
        }
    }
}

// §7.2 — Accueil, Appareils, Carte, Dossiers, Profil
struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem { Label("Accueil", systemImage: "house.fill") }
            DevicesView()
                .tabItem { Label("Appareils", systemImage: "iphone.gen3") }
            MapScreen()
                .tabItem { Label("Carte", systemImage: "map.fill") }
            HomeView()
                .tabItem { Label("Dossiers", systemImage: "doc.text.fill") } // TODO Phase 2 : liste + fiche
            SettingsPlaceholder()
                .tabItem { Label("Profil", systemImage: "person.crop.circle") }
        }
    }
}

struct SettingsPlaceholder: View {
    var body: some View {
        List {
            Section("Paramètres et confidentialité") {
                Label("Consentements et sessions — Phase 2", systemImage: "lock.shield")
                    .foregroundStyle(.secondary)
            }
            Section {
                Button("Se déconnecter", role: .destructive) {
                    Task { try? await ApiClient.shared.logout() }
                }
            }
        }
    }
}
