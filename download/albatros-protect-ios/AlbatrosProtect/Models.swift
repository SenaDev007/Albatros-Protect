// Albatros Protect — modèles de données (miroir API /api/v1)
import Foundation

struct SessionUser: Codable {
    let id: String
    let fullName: String
    let role: String
    let phone: String?
    let email: String?
}

struct Observation: Codable {
    let id: String
    let source: String
    let latitude: Double
    let longitude: Double
    let accuracyRadiusM: Double?
    let capturedAt: String
    let note: String?

    // §6.5 — vocabulaire officiel
    var sourceLabel: String {
        switch source {
        case "native_location": return "Position reçue de l'appareil"
        case "google_geolocation": return "Estimation Wi-Fi/cellulaire"
        case "ble_witness": return "Détection Bluetooth à proximité"
        case "operator_authorized": return "Position communiquée par un partenaire autorisé"
        default: return "Source inconnue"
        }
    }
}

struct Device: Codable {
    let id: String
    let deviceId: String
    let category: String
    let brand: String
    let model: String
    let osName: String?
    let enrolled: Bool
    let lastTransmissionAt: String?
    let lastObservation: Observation?
}

struct Incident: Codable {
    let id: String
    let refNumber: String
    let type: String
    let status: String
    let occurredAt: String
    let locationText: String
    let lastObservation: Observation?

    var isOpen: Bool { status != "closed" && status != "draft" }
}

struct DevicesResponse: Codable { let devices: [Device] }
struct IncidentsResponse: Codable { let incidents: [Incident] }
struct StartOtpResponse: Codable {
    let sent: Bool?
    let demoCode: String?
    enum CodingKeys: String, CodingKey {
        case sent, demoCode = "demo_code"
    }
}
struct VerifyResponse: Codable {
    let user: SessionUser?
    let stepUpTicket: String?
    enum CodingKeys: String, CodingKey {
        case user, stepUpTicket = "step_up_ticket"
    }
}
struct CreateIncidentResponse: Codable {
    struct IncidentRef: Codable { let refNumber: String }
    let incident: IncidentRef
}
