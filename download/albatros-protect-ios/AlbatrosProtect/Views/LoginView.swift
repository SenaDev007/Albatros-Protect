// Albatros Protect — Login OTP (§8.1 : sobre ; les codes ne sont jamais réaffichés après validation)
import SwiftUI

struct LoginView: View {
    @State private var identifier = ""
    @State private var code = ""
    @State private var codeSent = false
    @State private var demoCode: String? // pilote uniquement
    @State private var message: String?
    @State private var loading = false
    @ObservedObject private var api = ApiClient.shared

    var body: some View {
        VStack(spacing: 24) {
            VStack(spacing: 4) {
                Text("ALBATROS").font(.system(size: 34, weight: .bold))
                Text("PROTECT")
                    .font(.system(size: 34, weight: .heavy))
                    .foregroundStyle(.rougePrincipal)
                Text("Protéger. Localiser. Récupérer.")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(.top, 60)

            if !codeSent {
                TextField("Téléphone ou email", text: $identifier)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.emailAddress)
                    .textInputAutocapitalization(.never)
                    .padding(.horizontal, 32)
                Button {
                    Task { await start() }
                } label: {
                    if loading { ProgressView().frame(width: 180) }
                    else { Text("Recevoir le code").frame(width: 180) }
                }
                .buttonStyle(.borderedProminent)
                .disabled(identifier.count < 5 || loading)
            } else {
                SecureField("Code à 6 chiffres", text: $code)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.numberPad)
                    .padding(.horizontal, 32)
                if let demoCode {
                    Text("Mode pilote — code : \(demoCode)")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
                Button {
                    Task { await verify() }
                } label: {
                    if loading { ProgressView().frame(width: 180) }
                    else { Text("Vérifier et continuer").frame(width: 180) }
                }
                .buttonStyle(.borderedProminent)
                .disabled(code.count != 6 || loading)
                Button("Changer d'identifiant") {
                    codeSent = false; code = ""; demoCode = nil
                }
                .font(.caption)
            }

            if let message {
                Text(message).font(.footnote).foregroundStyle(.secondary)
                    .padding(.horizontal, 32).multilineTextAlignment(.center)
            }
            Spacer()
        }
    }

    private func start() async {
        loading = true
        defer { loading = false }
        do {
            let res = try await api.otpStart(identifier)
            demoCode = res.demoCode
            codeSent = true
        } catch { message = error.localizedDescription }
    }

    private func verify() async {
        loading = true
        defer { loading = false }
        do {
            try await api.otpVerify(identifier, code: code)
            // la session passe automatiquement à MainTabView
        } catch { message = error.localizedDescription }
    }
}
