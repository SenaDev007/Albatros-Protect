// Albatros Protect — Parcours de signalement §7.5 + vérification renforcée F-003
import SwiftUI

struct IncidentWizardView: View {
    @Environment(\.dismiss) private var dismiss
    @State private var step = 0
    @State private var deviceId = ""
    @State private var type = "loss"
    @State private var location = ""
    @State private var description = ""
    @State private var code = ""
    @State private var stepUpTicket: String?
    @State private var resultRef: String?
    @State private var errorText: String?
    @State private var loading = false

    private let steps = ["Appareil", "Type", "Lieu", "Confirmation", "Référence"]

    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 18) {
                ProgressView(value: Double(step + 1), total: Double(steps.count))

                switch step {
                case 0:
                    TextField("ID de l'appareil (ALB-XXXXXX)", text: $deviceId)
                        .textFieldStyle(.roundedBorder)
                        .autocapitalization(.none)
                case 1:
                    Picker("Type", selection: $type) {
                        Text("Perte").tag("loss")
                        Text("Vol").tag("theft")
                    }
                    .pickerStyle(.segmented)
                case 2:
                    TextField("Lieu déclaré, si connu", text: $location)
                        .textFieldStyle(.roundedBorder)
                    TextField("Circonstances (facultatif)", text: $description, axis: .vertical)
                        .lineLimit(3...5)
                        .textFieldStyle(.roundedBorder)
                case 3:
                    // §7.5 — la confirmation indique ce qui a réellement été enregistré
                    Text("""
                        Le dossier enregistrera : \(type == "theft" ? "vol" : "perte"), \
                        \(location.isEmpty ? "lieu non précisé" : location).

                        Aucune plainte officielle n'est déposée et aucun opérateur n'est \
                        contacté automatiquement. Une vérification renforcée est requise \
                        avant l'enregistrement (code à usage unique envoyé à votre identifiant).
                        """)
                        .font(.subheadline)
                    if stepUpTicket == nil {
                        SecureField("Code de vérification (6 chiffres)", text: $code)
                            .textFieldStyle(.roundedBorder)
                            .keyboardType(.numberPad)
                        Button {
                            Task { await stepUp() }
                        } label: {
                            if loading { ProgressView() } else { Text("Valider le code") }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(code.count != 6 || loading)
                    } else {
                        Label("Vérification renforcée validée", systemImage: "checkmark.shield.fill")
                            .foregroundStyle(Color.rougePrincipal)
                    }
                default:
                    if let resultRef {
                        VStack(alignment: .leading, spacing: 10) {
                            Label("Dossier \(resultRef) créé", systemImage: "checkmark.circle.fill")
                                .font(.headline)
                            Text("""
                                Actions immédiates : sécurisez vos comptes, contactez votre \
                                opérateur pour suspendre la SIM, déposez plainte en cas de vol. \
                                Ne vous rendez jamais seul vers une position.
                                """)
                                .font(.subheadline)
                        }
                    }
                }

                if let errorText {
                    Text(errorText).font(.footnote).foregroundStyle(.red)
                }

                Spacer()

                HStack {
                    if (1...3).contains(step) {
                        Button("Retour") { step -= 1 }.disabled(loading)
                    }
                    Spacer()
                    if step < 3 {
                        Button("Continuer") { step += 1 }
                            .buttonStyle(.borderedProminent)
                            .tint(.rougePrincipal)
                            .disabled(loading)
                    } else if step == 3, stepUpTicket != nil, resultRef == nil {
                        Button("Enregistrer le signalement") {
                            Task { await submit() }
                        }
                        .buttonStyle(.borderedProminent)
                        .tint(.rougePrincipal)
                        .disabled(loading)
                    }
                }
            }
            .padding(16)
            .navigationTitle("Signaler")
            .toolbar { ToolbarItem(placement: .cancellationAction) { Button("Fermer") { dismiss() } } }
        }
    }

    private func stepUp() async {
        loading = true
        defer { loading = false }
        do {
            // F-003 — OTP step-up délivre un ticket à usage unique
            guard let identifier = ApiClient.shared.user?.phone ?? ApiClient.shared.user?.email else {
                errorText = "Identifiant vérifié introuvable."; return
            }
            _ = try await ApiClient.shared.otpStart(identifier, purpose: "step_up")
            let res = try await ApiClient.shared.otpVerify(identifier, code: code, purpose: "step_up")
            stepUpTicket = res.stepUpTicket
        } catch { errorText = error.localizedDescription }
    }

    private func submit() async {
        loading = true
        defer { loading = false }
        guard let ticket = stepUpTicket else { return }
        do {
            let ref = try await ApiClient.shared.createIncident(
                deviceId: deviceId, type: type,
                locationText: location.isEmpty ? "Non précisé" : location,
                description: description.isEmpty ? nil : description,
                stepUpTicket: ticket
            )
            resultRef = ref
            step = 4
        } catch { errorText = error.localizedDescription }
    }
}
