// Albatros Protect — client API /api/v1 (URLSession async/await, sessions cookies)
import Foundation

enum ApiError: Error, LocalizedError {
    case server(code: String, message: String)
    case network

    var errorDescription: String? {
        switch self {
        case .server(_, let message): return message
        case .network: return "Réseau indisponible — vérifiez votre connexion."
        }
    }
}

final class ApiClient: ObservableObject {
    static let shared = ApiClient()

    // En simulateur : localhost hôte. En production : URL HTTPS du pilote.
    var baseUrl = "http://localhost:3000/api/v1"
    private let session: URLSession = {
        let config = URLSessionConfiguration.default
        config.httpCookieAcceptPolicy = .always
        config.httpShouldSetCookies = true
        return URLSession(configuration: config)
    }()

    @Published var user: SessionUser?

    private func request<T: Decodable>(
        _ method: String, _ path: String,
        body: [String: Any]? = nil,
        as type: T.Type
    ) async throws -> T {
        guard var components = URLComponents(string: "\(baseUrl)\(path)") else {
            throw ApiError.server(code: "CONFIG", message: "URL invalide")
        }
        components.query = components.percentEncodedQuery // préserve les query params
        var req = URLRequest(url: components.url!)
        req.httpMethod = method
        if let body {
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        let data: Data
        let response: URLResponse
        do {
            (data, response) = try session.synchronousData(req)
        } catch {
            throw ApiError.network
        }
        guard let http = response as? HTTPURLResponse else { throw ApiError.network }
        if http.statusCode >= 400 {
            if let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
               let code = obj["error"] as? String {
                throw ApiError.server(code: code, message: (obj["message"] as? String) ?? code)
            }
            throw ApiError.server(code: "HTTP_\(http.statusCode)", message: "Erreur serveur.")
        }
        return try JSONDecoder().decode(T.self, from: data)
    }

    // ---- Auth (F-001, F-003) ----
    func otpStart(_ identifier: String, purpose: String = "login") async throws -> StartOtpResponse {
        try await request("POST", "/auth/otp/start",
                         body: ["identifier": identifier, "purpose": purpose],
                         as: StartOtpResponse.self)
    }

    @discardableResult
    func otpVerify(_ identifier: String, code: String, purpose: String = "login") async throws -> VerifyResponse {
        let res = try await request("POST", "/auth/otp/verify",
                                    body: ["identifier": identifier, "code": code, "purpose": purpose],
                                    as: VerifyResponse.self)
        await MainActor.run { self.user = res.user }
        return res
    }

    func logout() async throws {
        struct Ok: Decodable { let logout: Bool? }
        _ = try await request("DELETE", "/auth/session", as: Ok.self)
        await MainActor.run { self.user = nil }
    }

    // ---- Appareils / incidents ----
    func devices() async throws -> [Device] {
        try await request("GET", "/devices", as: DevicesResponse.self).devices
    }

    func incidents() async throws -> [Incident] {
        try await request("GET", "/incidents", as: IncidentsResponse.self).incidents
    }

    func createIncident(deviceId: String, type: String, locationText: String,
                         description: String?, stepUpTicket: String) async throws -> String {
        var body: [String: Any] = [
            "device_id": deviceId, "type": type,
            "location_text": locationText,
            "occurred_at": ISO8601DateFormatter().string(from: Date()),
            "step_up_ticket": stepUpTicket,
        ]
        if let description { body["description"] = description }
        let res = try await request("POST", "/incidents", body: body,
                                    as: CreateIncidentResponse.self)
        return res.incident.refNumber
    }

    // ---- Observations (F-030, §11) ----
    struct MapResponse: Decodable {
        let observations: [Observation]
        let honesty: Honesty
        struct Honesty: Decodable { let disclaimer: String }
    }

    func incidentMap(_ id: String) async throws -> MapResponse {
        try await request("GET", "/incidents/\(id)/map", as: MapResponse.self)
    }
}

private extension URLSession {
    func synchronousData(_ req: URLRequest) async throws -> (Data, URLResponse) {
        try await withCheckedThrowingContinuation { continuation in
            let task = self.dataTask(with: req) { data, response, error in
                if let error { continuation.resume(throwing: error) }
                else if let data, let response { continuation.resume(returning: (data, response)) }
                else { continuation.resume(throwing: ApiError.network) }
            }
            task.resume()
        }
    }
}
