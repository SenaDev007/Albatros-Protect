// Agent Albatros — état global (navigation SPA + session + routage par hash)
// Chaque vue possède un lien partageable (#/connexion, #/inscription, #/carte…),
// le bouton « retour » du navigateur fonctionne via history/popstate.
import { create } from "zustand";
import type { SessionUser } from "./types";

export type View =
  | "landing"
  | "auth"
  | "dashboard"
  | "devices"
  | "preparation"
  | "incidents"
  | "incident"
  | "map"
  | "circles"
  | "steps"
  | "notifications"
  | "help"
  | "settings"
  | "console";

export type AuthIntent = "login" | "signup";

export interface SetViewOpts {
  intent?: AuthIntent;
  replace?: boolean;
}

// --- Correspondances vue ↔ chemin (hash) ---
const VIEW_TO_PATH: Partial<Record<View, string>> = {
  dashboard: "tableau-de-bord",
  devices: "appareils",
  preparation: "preparation",
  incidents: "incidents",
  map: "carte",
  circles: "cercles",
  steps: "demarches",
  notifications: "notifications",
  help: "aide",
  settings: "parametres",
  console: "console",
};
const PATH_TO_VIEW: Record<string, View> = Object.fromEntries(
  Object.entries(VIEW_TO_PATH).map(([v, p]) => [p, v as View]),
) as Record<string, View>;

function hashToState(hash: string): { view: View; intent: AuthIntent; incidentId: string | null } {
  const h = decodeURIComponent(hash).replace(/^#\/?/, "").replace(/\/+$/, "");
  if (h === "inscription") return { view: "auth", intent: "signup", incidentId: null };
  if (h === "connexion") return { view: "auth", intent: "login", incidentId: null };
  if (h.startsWith("incident/")) {
    return { view: "incident", intent: "login", incidentId: h.slice("incident/".length) || null };
  }
  if (h && PATH_TO_VIEW[h]) return { view: PATH_TO_VIEW[h], intent: "login", incidentId: null };
  // « », « #/ », ancres d'ancrage (#fonctionnement…) → accueil public
  return { view: "landing", intent: "login", incidentId: null };
}

function stateToHash(view: View, intent: AuthIntent, incidentId: string | null): string {
  if (view === "landing") return "#/";
  if (view === "auth") return intent === "signup" ? "#/inscription" : "#/connexion";
  if (view === "incident") return incidentId ? `#/incident/${encodeURIComponent(incidentId)}` : "#/incidents";
  return `#/${VIEW_TO_PATH[view] ?? ""}`.replace(/\/$/, "");
}

/** Met à jour l'URL (push pour une navigation, replace pour une redirection). */
function syncUrl(view: View, intent: AuthIntent, incidentId: string | null, replace: boolean) {
  if (typeof window === "undefined") return;
  const hash = stateToHash(view, intent, incidentId);
  if (window.location.hash === hash) return;
  const url = `${window.location.pathname}${window.location.search}${hash === "#/" ? "" : hash}`;
  if (replace) window.history.replaceState(window.history.state, "", url);
  else window.history.pushState({ albatrosView: view }, "", url);
}

// État initial déduit du lien d'arrivée (#/connexion partagé, etc.)
const initial =
  typeof window !== "undefined"
    ? hashToState(window.location.hash)
    : { view: "landing" as View, intent: "login" as AuthIntent, incidentId: null as string | null };

interface AlbatrosState {
  user: SessionUser | null;
  view: View;
  authIntent: AuthIntent;
  focusIncidentId: string | null;
  focusDeviceId: string | null;
  refreshKey: number;
  setSessionUser: (u: SessionUser | null) => void;
  setView: (v: View, opts?: SetViewOpts) => void;
  openIncident: (id: string) => void;
  openDevice: (id: string, view?: View) => void;
  refresh: () => void;
  logout: () => Promise<void>;
}

export const useAlbatros = create<AlbatrosState>((set) => ({
  user: null,
  view: initial.view,
  authIntent: initial.intent,
  focusIncidentId: initial.incidentId,
  focusDeviceId: null,
  refreshKey: 0,
  setSessionUser: (u) => set({ user: u }),
  setView: (v, opts) => {
    const s = useAlbatros.getState();
    const intent = v === "auth" ? (opts?.intent ?? s.authIntent ?? "login") : s.authIntent;
    set({ view: v, authIntent: intent, focusIncidentId: null, focusDeviceId: null });
    syncUrl(v, intent, null, opts?.replace ?? false);
  },
  openIncident: (id) => {
    set({ view: "incident", focusIncidentId: id, focusDeviceId: null });
    syncUrl("incident", "login", id, false);
  },
  openDevice: (id, view = "devices") => {
    set({ view, focusDeviceId: id, focusIncidentId: null });
    syncUrl(view, "login", null, false);
  },
  refresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  logout: async () => {
    try {
      await fetch("/api/v1/auth/session", { method: "DELETE" });
    } catch {
      /* la session expire localement quoi qu'il arrive */
    }
    set({ user: null, view: "landing", authIntent: "login", focusIncidentId: null, focusDeviceId: null });
    syncUrl("landing", "login", null, true);
  },
}));

// Bouton « retour » / « suivant » du navigateur : restaure la vue depuis l'URL
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    const next = hashToState(window.location.hash);
    useAlbatros.setState({
      view: next.view,
      authIntent: next.intent,
      focusIncidentId: next.incidentId,
      focusDeviceId: null,
    });
  });
}
