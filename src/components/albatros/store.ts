// Agent Albatros — état global (navigation SPA + session)
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

interface AlbatrosState {
  user: SessionUser | null;
  view: View;
  focusIncidentId: string | null;
  focusDeviceId: string | null;
  refreshKey: number;
  setSessionUser: (u: SessionUser | null) => void;
  setView: (v: View) => void;
  openIncident: (id: string) => void;
  openDevice: (id: string, view?: View) => void;
  refresh: () => void;
  logout: () => Promise<void>;
}

export const useAlbatros = create<AlbatrosState>((set) => ({
  user: null,
  view: "landing",
  focusIncidentId: null,
  focusDeviceId: null,
  refreshKey: 0,
  setSessionUser: (u) => set({ user: u }),
  setView: (v) => set({ view: v }),
  openIncident: (id) => set({ view: "incident", focusIncidentId: id }),
  openDevice: (id, view = "devices") => set({ view, focusDeviceId: id }),
  refresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),
  logout: async () => {
    try {
      await fetch("/api/v1/auth/session", { method: "DELETE" });
    } catch {
      /* la session expire localement quoi qu'il arrive */
    }
    set({ user: null, view: "landing", focusIncidentId: null, focusDeviceId: null });
  },
}));
