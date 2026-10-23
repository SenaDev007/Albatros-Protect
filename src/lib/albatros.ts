// Agent Albatros — constantes métier, libellés et helpers partagés
// Aligné CDC §4.1 (transparence des sources) et spec §6.2 (codes d'erreur)

export type ObservationSource =
  | "native_location"
  | "google_geolocation"
  | "ble_witness"
  | "operator_authorized";

export const OBSERVATION_SOURCES: Record<
  ObservationSource,
  { label: string; short: string; color: string; description: string }
> = {
  native_location: {
    label: "Position de l'appareil",
    short: "Appareil",
    color: "#E11D2E",
    description:
      "Position transmise par l'application/agent installé sur l'appareil, via les API de localisation autorisées du système.",
  },
  google_geolocation: {
    label: "Estimation Wi-Fi/cellulaire (Google)",
    short: "Estimation",
    color: "#F59E0B",
    description:
      "Estimation calculée par Google Maps Platform Geolocation API à partir d'observations Wi-Fi/cellulaires autorisées, avec son rayon d'incertitude.",
  },
  ble_witness: {
    label: "Détection Bluetooth (téléphone participant)",
    short: "Bluetooth",
    color: "#8B5CF6",
    description:
      "Un téléphone participant au réseau a détecté un identifiant temporaire à proximité. La position affichée est celle du détecteur, pas un GPS de l'appareil recherché.",
  },
  operator_authorized: {
    label: "Position communiquée par un partenaire",
    short: "Partenaire",
    color: "#14B8A6",
    description:
      "Zone communiquée par un opérateur ou une autorité habilitée, uniquement dans le cadre d'une convention active et d'une procédure légale.",
  },
};

export type IncidentStatus =
  | "draft"
  | "submitted"
  | "verification_required"
  | "ready_to_transmit"
  | "transmitted"
  | "processing"
  | "response_received"
  | "closed"
  | "disputed";

export const INCIDENT_STATUSES: Record<
  IncidentStatus,
  { label: string; tone: "neutral" | "info" | "warn" | "success" | "danger" }
> = {
  draft: { label: "Brouillon", tone: "neutral" },
  submitted: { label: "Soumis", tone: "info" },
  verification_required: { label: "Vérification requise", tone: "warn" },
  ready_to_transmit: { label: "Prêt à transmettre", tone: "info" },
  transmitted: { label: "Transmis au partenaire", tone: "info" },
  processing: { label: "En traitement", tone: "info" },
  response_received: { label: "Réponse reçue", tone: "success" },
  closed: { label: "Clôturé", tone: "success" },
  disputed: { label: "Contesté", tone: "danger" },
};

export const DEVICE_CATEGORIES: Record<
  string,
  { label: string; icon: string }
> = {
  smartphone: { label: "Smartphone", icon: "smartphone" },
  tablet: { label: "Tablette", icon: "tablet" },
  laptop: { label: "PC portable", icon: "laptop" },
  desktop: { label: "PC de bureau", icon: "desktop" },
};

export const CONSENT_PURPOSES: Record<string, string> = {
  location: "Transmission de position (localisation directe)",
  ble_detection: "Participation au réseau de détection Bluetooth",
  data_processing: "Traitement des données du dossier",
  partner_exchange: "Échanges futurs avec partenaires (sous convention)",
};

export const API_ERROR_MESSAGES: Record<string, string> = {
  PERMISSION_MISSING:
    "Permission manquante — activez la fonction concernée dans les réglages de l'appareil.",
  LOCATION_UNAVAILABLE:
    "Aucune position disponible actuellement. Aucune position n'est fabriquée.",
  RADIO_INPUT_UNAVAILABLE:
    "Observations Wi-Fi/cellulaires insuffisantes : aucun appel de localisation possible.",
  GOOGLE_QUOTA_EXCEEDED:
    "Quota du fournisseur atteint — réessayez plus tard.",
  GOOGLE_PROVIDER_UNAVAILABLE:
    "Fournisseur de localisation momentanément indisponible.",
  DEVICE_NOT_ENROLLED:
    "Appareil non enrôlé : l'application/agent n'a pas encore été installé et confirmé.",
  INCIDENT_NOT_VERIFIED:
    "Dossier non vérifié : la vérification de propriété est requise avant cette action.",
  CONSENT_REVOKED:
    "Consentement révoqué : la collecte concernée est arrêtée.",
  PARTNER_FLOW_NOT_ENABLED:
    "Aucun parcours partenaire actif sans convention signée : utilisez le dossier exportable et les instructions officielles.",
  AUTH_REQUIRED: "Authentification requise.",
  STEP_UP_REQUIRED:
    "Vérification renforcée requise pour cette action sensible (F-003).",
  FORBIDDEN: "Vous n'avez pas accès à cette ressource.",
  VALIDATION_ERROR: "Données invalides.",
};

// ---- Helpers partagés client/serveur ----

export function maskIdentifier(value: string): string {
  if (!value) return "—";
  if (value.length <= 6) return value[0] + "•".repeat(value.length - 1);
  return `${value.slice(0, 3)}${"•".repeat(Math.max(value.length - 5, 4))}${value.slice(-2)}`;
}

export function genRefNumber(seq: number): string {
  const year = new Date().getFullYear();
  return `ALB-INC-${year}-${String(seq).padStart(4, "0")}`;
}

export function genDeviceId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `ALB-${s}`;
}

export function freshnessBucket(capturedAt: string | Date): {
  key: "fresh" | "recent" | "stale" | "very_old";
  label: string;
} {
  const ageMin = (Date.now() - new Date(capturedAt).getTime()) / 60000;
  if (ageMin < 15) return { key: "fresh", label: "Position récente" };
  if (ageMin < 60) return { key: "recent", label: "Position de moins d'une heure" };
  if (ageMin < 24 * 60) return { key: "stale", label: "Position ancienne" };
  return { key: "very_old", label: "Très ancienne dernière position connue" };
}

export function formatAgo(date: string | Date): string {
  const s = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
  if (s < 60) return `il y a ${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export function readinessScore(d: {
  enrolled?: boolean;
  locationEnabled?: boolean;
  bleEnabled?: boolean;
  notificationsEnabled?: boolean;
  batteryOptimized?: boolean;
  proofUploaded?: boolean;
  identifiersComplete?: boolean;
}): number {
  const checks: boolean[] = [
    !!d.enrolled,
    !!d.locationEnabled,
    !!d.bleEnabled,
    !!d.notificationsEnabled,
    !!d.batteryOptimized,
    !!d.proofUploaded,
    !!d.identifiersComplete,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
