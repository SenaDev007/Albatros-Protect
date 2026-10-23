// Agent Albatros — coquille applicative (navigation latérale + mobile + pied de page)
"use client";

import { useState } from "react";
import { useAlbatros, type View } from "./store";
import { AlbatrosLogo, AlbatrosMark } from "./shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard, Smartphone, ShieldCheck, Siren, Map, Users, Settings,
  Terminal, LogOut, Menu,
} from "lucide-react";

interface NavItem { view: View; label: string; icon: React.ComponentType<{ className?: string }>; staff?: boolean }

const NAV: NavItem[] = [
  { view: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { view: "devices", label: "Mes appareils", icon: Smartphone },
  { view: "preparation", label: "Préparation", icon: ShieldCheck },
  { view: "incidents", label: "Incidents", icon: Siren },
  { view: "map", label: "Carte", icon: Map },
  { view: "circles", label: "Cercles", icon: Users },
  { view: "settings", label: "Paramètres", icon: Settings },
  { view: "console", label: "Console (démo)", icon: Terminal, staff: true },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView, user } = useAlbatros();
  const items = NAV.filter((n) => !n.staff || user?.role === "admin" || user?.role === "support");
  return (
    <nav className="flex flex-col gap-1" aria-label="Navigation principale">
      {items.map((item) => (
        <button
          key={item.view}
          onClick={() => { setView(item.view); onNavigate?.(); }}
          aria-current={view === item.view ? "page" : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
            view === item.view || (view === "incident" && item.view === "incidents")
              ? "bg-primary/15 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
          {view === item.view && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />}
        </button>
      ))}
    </nav>
  );
}

function UserFooter({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAlbatros();
  const initials = (user?.fullName ?? "U").split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "border-t border-border pt-4"}`}>
      <Avatar className="h-9 w-9 border border-border">
        <AvatarFallback className="bg-primary/15 text-primary text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{user?.fullName}</div>
        <div className="truncate text-xs text-muted-foreground">
          {user?.phone ?? user?.email}
          {user?.role === "admin" && " · rôle démo"}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={() => logout()} title="Se déconnecter" aria-label="Se déconnecter">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { view, setView } = useAlbatros();
  const [menuOpen, setMenuOpen] = useState(false);
  const isIncident = view === "incident";

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Barre latérale (desktop) */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <div className="px-2 pb-6">
            <AlbatrosLogo />
          </div>
          <div className="flex-1">
            <NavList />
          </div>
          <UserFooter />
        </aside>

        {/* Contenu principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* En-tête mobile */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
            <AlbatrosLogo size={26} />
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-sidebar">
                <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                <div className="mt-2">
                  <AlbatrosLogo />
                </div>
                <div className="mt-6">
                  <NavList onNavigate={() => setMenuOpen(false)} />
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <UserFooter compact />
                </div>
              </SheetContent>
            </Sheet>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>

          {/* Pied de page (sticky) */}
          <footer className="mt-auto border-t border-border bg-card/30 px-4 py-4 md:px-8">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlbatrosMark size={16} />
                <span>Agent Albatros — pilote Cotonou · positions jamais fabriquées</span>
              </div>
              {isIncident && (
                <button onClick={() => setView("incidents")} className="text-primary hover:underline">
                  ← Retour aux incidents
                </button>
              )}
              <span>Aucune donnée réelle — mode démonstration</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Navigation mobile basse */}
      <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur lg:hidden" aria-label="Navigation rapide">
        {NAV.filter((n) => n.view !== "console").slice(0, 5).map((item) => (
          <button
            key={item.view}
            onClick={() => setView(item.view)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${
              view === item.view ? "text-primary" : "text-muted-foreground"
            }`}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
            {item.label.split(" ")[0]}
          </button>
        ))}
      </nav>
    </div>
  );
}
