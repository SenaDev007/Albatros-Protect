// Agent Albatros — types côté client (miroir des réponses API /v1)

export interface SessionUser {
  id: string;
  fullName: string;
  role: string;
  phone: string | null;
  email: string | null;
  verifiedAt?: string | null;
  createdAt?: string;
}

export interface DeviceIdentifier {
  id: string;
  type: string;
  value: string;
  verified: boolean;
}

export interface Consent {
  id: string;
  purpose: string;
  permission: string;
  textVersion: string;
  granted: boolean;
  grantedAt: string;
  revokedAt: string | null;
  deviceId: string | null;
}

export interface Observation {
  id: string;
  deviceId: string;
  incidentId: string | null;
  source: string;
  latitude: number;
  longitude: number;
  accuracyRadiusM: number | null;
  capturedAt: string;
  receivedAt: string;
  mode: string;
  quality: string;
  note: string | null;
}

export interface Device {
  id: string;
  deviceId: string;
  category: string;
  brand: string;
  model: string;
  color: string | null;
  osName: string | null;
  osVersion: string | null;
  status: string;
  enrolled: boolean;
  locationEnabled: boolean;
  bleEnabled: boolean;
  notificationsEnabled: boolean;
  batteryOptimized: boolean;
  proofUploaded: boolean;
  identifiersComplete: boolean;
  lastTransmissionAt: string | null;
  createdAt: string;
  identifiersCount?: number;
  lastObservation?: Observation | null;
  openIncident?: IncidentLite | null;
}

export interface IncidentLite {
  id: string;
  refNumber: string;
  type: string;
  status: string;
}

export interface IncidentEvent {
  id: string;
  type: string;
  label: string;
  detail: string | null;
  actorRole: string;
  createdAt: string;
}

export interface PartnerRequest {
  id: string;
  partnerType: string;
  partnerName: string;
  requestType: string;
  motive: string;
  status: string;
  note: string | null;
}

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  sizeKb: number;
  uploadedAt: string;
  expiresAt: string | null;
  deviceId: string | null;
  incidentId: string | null;
}

export interface Incident {
  id: string;
  refNumber: string;
  userId: string;
  deviceId: string;
  type: "loss" | "theft" | string;
  status: string;
  occurredAt: string;
  declaredAt: string;
  locationText: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  simPhone: string | null;
  policeReportRef: string | null;
  closedAt: string | null;
  closeReason: string | null;
  device?: Device;
  partnerRequests?: PartnerRequest[];
  lastObservation?: Observation | null;
}

export interface IncidentDetail {
  incident: Incident;
  events: IncidentEvent[];
  observations: Observation[];
  partnerRequests: PartnerRequest[];
  documents: DocumentFile[];
  identifiers: DeviceIdentifier[];
}

export interface CircleMember {
  id: string;
  inviteName: string;
  inviteContact: string;
  status: string;
  joinedAt: string | null;
  createdAt: string;
}

export interface ShareGrant {
  id: string;
  circleId: string;
  incidentId: string | null;
  deviceId: string | null;
  dataShared: string;
  expiresAt: string;
  revokedAt: string | null;
  createdAt: string;
  circle?: { id: string; name: string };
  incident?: IncidentLite | null;
}

export interface Circle {
  id: string;
  name: string;
  createdAt: string;
  members: CircleMember[];
  shareGrants: ShareGrant[];
}

export interface AuditEntry {
  id: string;
  actorId: string | null;
  actorRole: string;
  action: string;
  objectType: string;
  objectId: string | null;
  result: string;
  reason: string | null;
  createdAt: string;
}

export interface PrivacyRequestItem {
  id: string;
  type: string;
  details: string;
  status: string;
  createdAt: string;
}

export interface SessionInfo {
  id: string;
  current: boolean;
  userAgent: string | null;
  createdAt: string;
  lastSeenAt: string;
}

export interface ConsoleStats {
  totals: {
    users: number;
    active_devices: number;
    incidents: number;
    open_incidents: number;
    closed_incidents: number;
    retrieved_devices: number;
    ble_encounters: number;
    privacy_requests: number;
  };
  incidents_by_status: Record<string, number>;
  observations_by_source: Record<string, number>;
  consents_by_purpose: Record<string, { granted: number; revoked: number }>;
}

export interface ConsoleIncident {
  id: string;
  refNumber: string;
  type: string;
  status: string;
  occurredAt: string;
  declaredAt: string;
  locationText: string;
  policeReportRef: string | null;
  closedAt: string | null;
  closeReason: string | null;
  device: { brand: string; model: string; category: string; deviceId: string };
  owner: { fullName: string; phone: string | null; email: string | null };
  partnerRequests: PartnerRequest[];
  eventsCount: number;
  observationsCount: number;
}
