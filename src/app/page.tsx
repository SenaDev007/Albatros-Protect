// Agent Albatros — portail pilote (application à page unique, route "/")
"use client";

import { useEffect, useState } from "react";
import { useAlbatros } from "@/components/albatros/store";
import { LandingView } from "@/components/albatros/landing";
import { AuthView } from "@/components/albatros/auth-view";
import { AppShell } from "@/components/albatros/app-shell";
import { DashboardView } from "@/components/albatros/dashboard";
import { DevicesView } from "@/components/albatros/devices-view";
import { PreparationView } from "@/components/albatros/preparation-view";
import { IncidentsView } from "@/components/albatros/incidents-view";
import { IncidentDetailView } from "@/components/albatros/incident-detail";
import { MapView } from "@/components/albatros/map-view";
import { CirclesView } from "@/components/albatros/circles-view";
import { SettingsView } from "@/components/albatros/settings-view";
import { ConsoleView } from "@/components/albatros/console-view";
import { NotificationsView } from "@/components/albatros/notifications-view";
import { StepsView } from "@/components/albatros/steps-view";
import { HelpView } from "@/components/albatros/help-view";
import { AlbatrosMark } from "@/components/albatros/shared";
import type { SessionUser } from "@/components/albatros/types";

export default function Page() {
  const { user, view, focusIncidentId, setSessionUser } = useAlbatros();
  const [booted, setBooted] = useState(false);

  // Restaure la session existante au chargement
  useEffect(() => {
    let alive = true;
    fetch("/api/v1/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { user?: SessionUser } | null) => {
        if (alive && d?.user) setSessionUser(d.user);
      })
      .catch(() => {})
      .finally(() => { if (alive) setBooted(true); });
    return () => { alive = false; };
  }, [setSessionUser]);

  if (!booted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <AlbatrosMark size={44} className="animate-pulse" />
        <p className="text-xs text-muted-foreground">Chargement du portail…</p>
      </div>
    );
  }

  if (!user) {
    return view === "auth" ? <AuthView /> : <LandingView />;
  }

  return (
    <AppShell>
      {view === "dashboard" && <DashboardView />}
      {view === "devices" && <DevicesView />}
      {view === "preparation" && <PreparationView />}
      {view === "incidents" && <IncidentsView />}
      {view === "incident" && focusIncidentId && <IncidentDetailView incidentId={focusIncidentId} />}
      {view === "map" && <MapView />}
      {view === "circles" && <CirclesView />}
      {view === "steps" && <StepsView />}
      {view === "notifications" && <NotificationsView />}
      {view === "help" && <HelpView />}
      {view === "settings" && <SettingsView />}
      {view === "console" && <ConsoleView />}
    </AppShell>
  );
}
