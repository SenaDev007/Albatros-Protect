// Agent Albatros — client API typé vers /api/v1
import type {
  Circle, ConsoleIncident, ConsoleStats, Consent, Device, DeviceIdentifier,
  DocumentFile, Incident, IncidentDetail, Observation, PartnerRequest,
  PrivacyRequestItem, SessionInfo, SessionUser, ShareGrant, CircleMember, AuditEntry,
} from "./types";

const BASE = "/api/v1";

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.error ?? "INTERNAL_ERROR", data.message ?? `Erreur ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Auth
  otpStart: (identifier: string, purpose: "login" | "step_up") =>
    req<{ sent: boolean; demo_code: string; demo_notice: string; purpose: string }>(
      "POST", "/auth/otp/start", { identifier, purpose }),
  otpVerify: (identifier: string, code: string, purpose: "login" | "step_up") =>
    req<{ user?: SessionUser; created?: boolean; step_up_verified?: boolean; step_up_ticket?: string }>(
      "POST", "/auth/otp/verify", { identifier, code, purpose }),
  session: () =>
    req<{ user: SessionUser; sessions: SessionInfo[] }>("GET", "/auth/session"),
  logout: () => req<{ logout: boolean }>("DELETE", "/auth/session"),
  revokeSession: (sessionId: string) =>
    req<{ revoked: string }>("DELETE", "/auth/session", { session_id: sessionId }),

  // Appareils
  devices: () => req<{ devices: Device[] }>("GET", "/devices"),
  deviceDetail: (id: string) =>
    req<{
      device: Device;
      identifiers: DeviceIdentifier[];
      consents: Consent[];
      observations: Observation[];
      incidents: Incident[];
      documents: DocumentFile[];
    }>("GET", `/devices/${id}`),
  createDevice: (payload: {
    category: string; brand: string; model: string; color?: string;
    os_name?: string; os_version?: string;
    identifiers?: { type: string; value: string }[];
  }) => req<{ device: Device }>("POST", "/devices", payload),
  updateDevice: (id: string, payload: Record<string, unknown>) =>
    req<{ device: Device }>("PATCH", `/devices/${id}`, payload),
  removeDevice: (id: string) => req<{ removed: boolean }>("DELETE", `/devices/${id}`),
  enrollDevice: (id: string) =>
    req<{ device: Device; first_observation: Observation; notice: string }>(
      "POST", `/devices/${id}/enrollment`),

  // Consentements
  consents: () => req<{ consents: Consent[] }>("GET", "/consents"),
  revokeConsent: (id: string) => req<{ revoked: boolean }>("DELETE", `/consents/${id}`),

  // Observations
  ingestLocation: (payload: Record<string, unknown>) =>
    req<{ observation: Observation }>("POST", "/observations/location", payload),
  radioEstimate: (deviceId: string, wifi: number, cell: number) =>
    req<{
      observation: Observation;
      triangulation: import("./types").TriangulationOverlay;
      quota_remaining_today: number;
      provider_note: string;
    }>(
      "POST", "/observations/radio", { device_id: deviceId, wifi_points: wifi, cell_towers: cell }),
  demoSimulate: (deviceId: string, action: string) =>
    req<{ observation?: Observation; unreachable?: boolean; message?: string }>(
      "POST", "/demo", { device_id: deviceId, action }),

  // Incidents
  incidents: () => req<{ incidents: Incident[] }>("GET", "/incidents"),
  incidentDetail: (id: string) => req<IncidentDetail>("GET", `/incidents/${id}`),
  createIncident: (payload: Record<string, unknown>) =>
    req<{ incident: Incident; immediate_actions: string[] }>("POST", "/incidents", payload),
  updateIncident: (id: string, payload: Record<string, unknown>) =>
    req<{ incident: Incident }>("PATCH", `/incidents/${id}`, payload),
  incidentMap: (id: string, qs = "") =>
    req<{
      incident: Incident;
      observations: Observation[];
      ble_encounters: unknown[];
      legend: { source: string; label: string; color: string; description: string }[];
      honesty: { disclaimer: string; fusion_note: string };
    }>("GET", `/incidents/${id}/map${qs}`),
  exportIncident: (id: string) => req<Record<string, unknown>>("GET", `/incidents/${id}/export`),
  partnerRequest: (id: string, payload: Record<string, unknown>) =>
    req<{ partner_request: PartnerRequest; enabled: boolean; error: string; message: string }>(
      "POST", `/incidents/${id}/partner-requests`, payload),

  // Cercles
  circles: () => req<{ circles: Circle[] }>("GET", "/circles"),
  createCircle: (name: string) => req<{ circle: Circle }>("POST", "/circles", { name }),
  deleteCircle: (id: string) => req<{ deleted: boolean }>("DELETE", `/circles/${id}`),
  inviteMember: (circleId: string, name: string, contact: string) =>
    req<{ membership: CircleMember; notice: string }>(
      "POST", `/circles/${circleId}/invitations`, { name, contact }),
  removeMember: (circleId: string, memberId: string) =>
    req<{ removed: boolean }>("DELETE", `/circles/${circleId}/members/${memberId}`),

  // Partages
  shareGrants: () => req<{ grants: ShareGrant[] }>("GET", "/share-grants"),
  createShareGrant: (payload: Record<string, unknown>) =>
    req<{ grant: ShareGrant; notice: string }>("POST", "/share-grants", payload),
  revokeShareGrant: (id: string) => req<{ revoked: boolean }>("DELETE", `/share-grants/${id}`),

  // Documents / droits
  documents: () => req<{ documents: DocumentFile[] }>("GET", "/documents"),
  uploadDocument: (payload: Record<string, unknown>) =>
    req<{ document: DocumentFile; notice: string }>("POST", "/documents", payload),
  privacyRequests: () => req<{ requests: PrivacyRequestItem[] }>("GET", "/privacy/requests"),
  createPrivacyRequest: (type: string, details: string) =>
    req<{ request: PrivacyRequestItem; notice: string }>("POST", "/privacy/requests", { type, details }),

  // Console
  consoleIncidents: () =>
    req<{ incidents: ConsoleIncident[]; privacyRequests: PrivacyRequestItem[]; support_view_notice: string }>(
      "GET", "/console/incidents"),
  consoleSetStatus: (id: string, status: string, note?: string) =>
    req<{ incident: ConsoleIncident }>("PATCH", `/console/incidents/${id}`, { status, note }),
  consoleStats: () => req<ConsoleStats>("GET", "/console/stats"),
  audit: () => req<{ events: AuditEntry[] }>("GET", "/audit"),

  // ── Back-office (trois espaces : système, GSM, police) ──
  boSession: () =>
    req<{ user: SessionUser; spaces: import("./types").BoSpaceInfo[] }>("GET", "/backoffice/session"),
  boStats: (space: string) =>
    req<import("./types").BoStats>("GET", `/backoffice/stats?space=${space}`),
  boUsers: (q?: string) =>
    req<{ users: import("./types").BoUser[] }>("GET", `/backoffice/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  boUpdateUser: (id: string, payload: { role?: string; organization?: string }) =>
    req<{ user: import("./types").BoUser }>("PATCH", `/backoffice/users/${id}`, payload),
  boIncidents: (space: string, status?: string) =>
    req<{ incidents: import("./types").BoIncident[] }>(
      "GET", `/backoffice/incidents?space=${space}${status ? `&status=${status}` : ""}`),
  boUpdateIncident: (id: string, payload: Record<string, unknown>) =>
    req<{ incident: import("./types").BoIncident }>("PATCH", `/backoffice/incidents/${id}`, payload),
  boPartnerRequests: (space: string) =>
    req<{ requests: import("./types").BoPartnerRequest[] }>(
      "GET", `/backoffice/partner-requests?space=${space}`),
  boUpdatePartnerRequest: (id: string, payload: Record<string, unknown>) =>
    req<{ request: import("./types").BoPartnerRequest; observation?: Observation | null }>(
      "PATCH", `/backoffice/partner-requests/${id}`, payload),
  boTriangulate: (incidentId: string, persist: boolean) =>
    req<{ triangulation: import("./types").TriangulationOverlay; observation?: Observation | null }>(
      "POST", "/backoffice/triangulation", { incident_id: incidentId, persist }),
  boAudit: (limit = 60) =>
    req<{ events: import("./types").BoAuditEntry[] }>("GET", `/backoffice/audit?limit=${limit}`),
  boPrivacyRequests: () =>
    req<{ requests: import("./types").BoPrivacyRequest[] }>("GET", "/backoffice/privacy-requests"),
  boUpdatePrivacyRequest: (id: string, status: string, note?: string) =>
    req<{ request: import("./types").BoPrivacyRequest }>(
      "PATCH", `/backoffice/privacy-requests/${id}`, { status, note }),
};
