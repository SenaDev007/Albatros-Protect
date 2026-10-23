// Albatros Protect — Carte §6.5/§7.6 : sources différenciées, état vide honnête.
// Phase 2 : Google Maps SDK pour iOS (clé restreinte au bundle ID) ou MapKit natif.
import SwiftUI
import MapKit

struct MapScreen: View {
    @State private var observations: [Observation] = []
    @State private var loading = true
    @State private var disclaimer: String?

    // Pilote Parakou
    private let parakou = CLLocationCoordinate2D(latitude: 9.3433, longitude: 2.6089)

    var body: some View {
        VStack(spacing: 0) {
            ZStack {
                if observations.isEmpty {
                    // §7.9 — état vide explicite, jamais de carte factice
                    VStack(spacing: 10) {
                        Image(systemName: "map").font(.largeTitle).foregroundStyle(.secondary)
                        Text("Aucune position disponible")
                            .font(.headline)
                        Text("Aucune observation réelle n'a été reçue. Rien n'est extrapolé — vérifiez que l'agent est enrôlé et les permissions accordées.")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                            .multilineTextAlignment(.center)
                            .padding(.horizontal, 32)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    // Phase 2 : Google Maps SDK (exigence Google Maps Platform).
                    // MapKit natif en attendant — les marqueurs gardent leur source/couleur.
                    Map(initialPosition: .region(MKCoordinateRegion(
                        center: observations.first.map { CLLocationCoordinate2D(latitude: $0.latitude, longitude: $0.longitude) } ?? parakou,
                        span: MKCoordinateSpan(latitudeDelta: 0.05, longitudeDelta: 0.05)
                    ))) {
                        ForEach(observations, id: \.id) { obs in
                            Annotation(obs.sourceLabel, coordinate: CLLocationCoordinate2D(latitude: obs.latitude, longitude: obs.longitude)) {
                                Circle()
                                    .fill(Color(hexLabel: obs.source))
                                    .frame(width: 14, height: 14)
                                    .overlay(Circle().stroke(.white, lineWidth: 2))
                            }
                        }
                    }
                    .mapStyle(.standard)
                }
            }

            // Fiche repliable §7.6 : source, heure, précision — visibles sans navigation
            VStack(alignment: .leading, spacing: 6) {
                if let disclaimer {
                    Text(disclaimer).font(.caption2).foregroundStyle(.secondary)
                }
                ForEach(observations.prefix(3), id: \.id) { obs in
                    HStack {
                        Circle().fill(Color(hexLabel: obs.source)).frame(width: 10, height: 10)
                        Text(obs.sourceLabel).font(.caption.weight(.medium))
                        Spacer()
                        Text(obs.capturedAt.replacingOccurrences(of: "T", with: " · "))
                            .font(.caption2).foregroundStyle(.secondary)
                    }
                }
                Text("Légende : rouge = position reçue de l'appareil · orange = estimation Wi-Fi/cellulaire · violet = détection Bluetooth à proximité · teal = partenaire autorisé.")
                    .font(.caption2).foregroundStyle(.secondary)
            }
            .padding(12)
            .background(Color(.secondarySystemBackground))
        }
        .navigationTitle("Carte et observations")
        .task { await load() }
    }

    private func load() async {
        defer { loading = false }
        do {
            let incidents = try await ApiClient.shared.incidents()
            guard let first = incidents.first(where: \.isOpen) else { return }
            let map = try await ApiClient.shared.incidentMap(first.id)
            observations = map.observations
            disclaimer = map.honesty.disclaimer
        } catch {
            // §7.9 — état d'erreur explicite
        }
    }
}

// Couleurs par source (§6.5)
private extension Color {
    init(hexLabel source: String) {
        switch source {
        case "native_location": self = .rougePrincipal
        case "google_geolocation": self = .sourceEstimation
        case "ble_witness": self = .sourceBle
        case "operator_authorized": self = .sourcePartenaire
        default: self = .grisMoyen
        }
    }
}
