// Agent Albatros — portail pilote (application à page unique, route "/")
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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
import type { SessionUser } from "@/components/albatros/types";

export default function Page() {
  const { user, view, focusIncidentId, setSessionUser, setView } = useAlbatros();
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

  // Utilisateur connecté : les vues publiques redirigent vers le tableau de bord
  // (replace → l'historique « retour » reste utilisable)
  useEffect(() => {
    if (user && (view === "auth" || view === "landing")) {
      setView("dashboard", { replace: true });
    }
  }, [user, view, setView]);

  if (!booted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
        <div className="relative">
          <div className="absolute -inset-8 animate-pulse rounded-[2.5rem] bg-primary/20 blur-3xl" />
          <div className="relative rotate-1 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-primary/20">
            <Image
              src="/brand/albatros-en-vol.webp"
              alt="Albatros Protect — albatros en vol devant un bouclier GPS"
              width={260}
              height={121}
              priority
              className="h-auto w-[260px]"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Chargement du portail…
        </div>
      </div>
    );
  }

  if (!user) {
    // Lien partagé vers une vue protégée (#/carte…) → invitation à se connecter
    return view === "landing" ? <LandingView /> : <AuthView />;
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
