// Albatros Protect — Accueil §7.3 : préparation réelle, appareils, actions rapides
import SwiftUI

struct HomeView: View {
    @State private var devices: [Device] = []
    @State private var loading = true
    @State private var errorText: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Text("Bonjour 👋")
                    .font(.system(size: 28, weight: .bold))
                    .padding(.top, 24)

                // Carte de préparation — critères réels, pas de jauge arbitraire (§7.3)
                VStack(alignment: .leading, spacing: 6) {
                    Text("Préparation").font(.headline)
                    if devices.isEmpty {
                        Text("Aucun appareil enregistré.").font(.subheadline)
                    } else {
                        let enrolled = devices.filter(\.enrolled).count
                        Text("\(enrolled) appareil(s) enrôlé(s) sur \(devices.count).")
                            .font(.subheadline)
                    }
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(16)
                .background(Color(.secondarySystemBackground))
                .clipShape(RoundedRectangle(cornerRadius: 14))

                Text("Mes appareils").font(.headline)
                if loading { ProgressView() }
                if let errorText { Text(errorText).font(.footnote).foregroundStyle(.secondary) }
                ForEach(devices, id: \.id) { device in
                    DeviceRow(device: device)
                }

                Text("Actions rapides").font(.headline).padding(.top, 8)
                NavigationLink {
                    IncidentWizardView()
                } label: {
                    Label("Signaler une perte ou un vol", systemImage: "exclamationmark.shield.fill")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .tint(.rougePrincipal)

                Label("Ajouter un appareil — parcours §7.4 en Phase 2", systemImage: "plus.circle")
                    .foregroundStyle(.secondary)
                    .font(.subheadline)

                // §12.3 — jamais de conclusion automatique ni d'illusion de suivi
                Text("Aucune position n'est fabriquée : une absence de donnée reste une absence d'information.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 16)
        }
        .task { await load() }
        .refreshable { await load() }
    }

    private func load() async {
        defer { loading = false }
        do {
            devices = try await ApiClient.shared.devices()
        } catch {
            errorText = error.localizedDescription // §7.9 : état explicite + action réaliste
        }
    }
}

struct DeviceRow: View {
    let device: Device

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("\(device.brand) \(device.model)").font(.subheadline.weight(.semibold))
            Text(device.enrolled ? "Agent actif" : "Non enrôlé — localisation impossible après vol")
                .font(.caption)
                .foregroundStyle(device.enrolled ? Color.rougePrincipal : Color.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(12)
        .background(Color(.secondarySystemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}
