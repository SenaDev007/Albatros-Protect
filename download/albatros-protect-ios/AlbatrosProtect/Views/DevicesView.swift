// Albatros Protect — Appareils : inventaire privé, identifiants masqués (§6.4, F-015)
import SwiftUI

func masked(_ value: String) -> String {
    guard value.count > 6 else { return String(value.first ?? "•") + String(repeating: "•", count: max(value.count - 1, 0)) }
    return value.prefix(3) + String(repeating: "•", count: value.count - 5) + value.suffix(2)
}

struct DevicesView: View {
    @State private var devices: [Device] = []
    @State private var loading = true
    @State private var errorText: String?

    var body: some View {
        // §9.2 — liste compacte, état vide explicite (§7.9)
        List {
            if loading { ProgressView() }
            if let errorText {
                Text(errorText).font(.footnote).foregroundStyle(.secondary)
            }
            if !loading && devices.isEmpty {
                Text("Aucun appareil enregistré.")
                    .foregroundStyle(.secondary)
            }
            ForEach(devices, id: \.id) { device in
                VStack(alignment: .leading, spacing: 3) {
                    Text("\(device.brand) \(device.model)").font(.subheadline.weight(.semibold))
                    Text("ID de service : \(masked(device.deviceId))")
                        .font(.caption).foregroundStyle(.secondary)
                    Text("Catégorie : \(device.category) · \(device.osName ?? "OS inconnu")")
                        .font(.caption).foregroundStyle(.secondary)
                }
                .padding(.vertical, 2)
            }
        }
        .navigationTitle("Mes appareils")
        .task {
            do { devices = try await ApiClient.shared.devices() }
            catch { errorText = error.localizedDescription }
            loading = false
        }
    }
}
