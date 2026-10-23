// Albatros Protect — coquille applicative (navigation §6.2, thème clair/sombre)
"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useAlbatros, type View } from "./store";
import { AlbatrosLogo, AlbatrosMark } from "./shared";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard, Smartphone, ShieldCheck, Siren, Map, Users, Settings,
  Terminal, LogOut, Menu, Sun, Moon, Bell, FileText, LifeBuoy, ClipboardList, Building2,
} from "lucide-react";

interface NavItem { view: View; label: string; icon: React.ComponentType<{ className?: string }>; staff?: boolean }

// §6.2 — Navigation de l'espace citoyen
const NAV_MAIN: NavItem[] = [
  { view: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { view: "devices", label: "Mes appareils", icon: Smartphone },
  { view: "preparation", label: "Préparation", icon: ShieldCheck },
  { view: "map", label: "Carte et observations", icon: Map },
  { view: "incidents", label: "Mes signalements", icon: Siren },
  { view: "circles", label: "Cercles de confiance", icon: Users },
];

const NAV_SECONDARY: NavItem[] = [
  { view: "steps", label: "Démarches et documents", icon: ClipboardList },
  { view: "notifications", label: "Notifications", icon: Bell },
  { view: "help", label: "Centre d'aide", icon: LifeBuoy },
  { view: "settings", label: "Paramètres et confidentialité", icon: Settings },
];

function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  // Pattern SSR-safe sans setState dans un effet
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";
  return (
    <Button
      variant="outline"
      size="icon"
      className={compact ? "h-9 w-9" : ""}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
      title={isDark ? "Mode clair" : "Mode sombre"}
    >
      {mounted ? (isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Sun className="h-4 w-4 opacity-0" />}
    </Button>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { view, setView, user } = useAlbatros();
  const items = [...NAV_MAIN, ...NAV_SECONDARY];
  const isStaff = user?.role === "admin" || user?.role === "support";
  const isBo = user?.role === "admin" || user?.role === "support"
    || user?.role === "gsm_operator" || user?.role === "police_officer";
  const boSpace = user?.role === "police_officer" ? "police" : user?.role === "gsm_operator" ? "gsm" : "system";
  const current = view === "incident" ? "incidents" : view;
  const button = (item: NavItem, secondary = false) => (
    <button
      key={item.view}
      onClick={() => { setView(item.view); onNavigate?.(); }}
      aria-current={current === item.view ? "page" : undefined}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        current === item.view
          ? "bg-primary/10 text-primary"
          : secondary
            ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      } ${secondary ? "text-[13px]" : ""}`}
    >
      <item.icon className={`h-4 w-4 ${secondary ? "h-3.5 w-3.5" : ""}`} />
      <span className="truncate">{item.label}</span>
      {current === item.view && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
    </button>
  );
  return (
    <nav className="flex flex-col gap-1" aria-label="Navigation principale">
      {NAV_MAIN.map((i) => button(i))}
      <div className="px-3 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
        Espace & aide
      </div>
      {NAV_SECONDARY.map((i) => button(i, true))}
      {isStaff && (
        <>
          <Separator className="my-2" />
          <div className="px-3 pb-1 pt-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Opérationnel
          </div>
          <button
            onClick={() => { setView("console"); onNavigate?.(); }}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${
              current === "console" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" /> Console opérationnelle (démo)
          </button>
        </>
      )}
      {isBo && (
        <>
          <Separator className="my-2" />
          <button
            onClick={() => { setView("backoffice", { space: boSpace as "system" | "gsm" | "police" }); onNavigate?.(); }}
            className={`flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
              current === "backoffice" ? "bg-primary/10 text-primary" : "text-primary hover:bg-primary/10"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" /> Back-office · 3 espaces
          </button>
        </>
      )}
    </nav>
  );
}

function UserFooter({ compact = false }: { compact?: boolean }) {
  const { user, logout } = useAlbatros();
  const initials = (user?.fullName ?? "U").split(" ").map((w) => w[0]).slice(0, 2).join("");
  return (
    <div className={`flex items-center gap-3 ${compact ? "" : "border-t border-border pt-4"}`}>
      <Avatar className="h-9 w-9 border border-border">
        <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials}</AvatarFallback>
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

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {/* Barre latérale (ordinateur) */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <div className="px-2 pb-6">
            <AlbatrosLogo />
          </div>
          <div className="flex-1 overflow-y-auto">
            <NavList />
          </div>
          <UserFooter />
        </aside>

        {/* Contenu principal */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* En-tête mobile */}
          <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
            <AlbatrosLogo size={26} />
            <div className="flex items-center gap-2">
              <ThemeToggle compact />
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
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-8 md:py-10">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>

          {/* Pied de page (sticky) */}
          <footer className="mt-auto border-t border-border bg-card/30 px-4 py-4 md:px-8">
            <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-2">
                <AlbatrosMark size={16} />
                <span>Albatros Protect — pilote Parakou · positions jamais fabriquées</span>
              </div>
              <div className="hidden items-center gap-3 lg:flex">
                <span className="italic">Protéger. Localiser. Récupérer.</span>
                <ThemeToggle compact />
              </div>
              <span>Aucune donnée réelle — mode démonstration</span>
            </div>
          </footer>
        </div>
      </div>

      {/* Navigation mobile basse (§9.2 : actions principales toujours accessibles) */}
      <nav className="sticky bottom-0 z-30 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur lg:hidden" aria-label="Navigation rapide">
        {([
          { view: "dashboard" as View, label: "Accueil", icon: LayoutDashboard },
          { view: "devices" as View, label: "Appareils", icon: Smartphone },
          { view: "map" as View, label: "Carte", icon: Map },
          { view: "incidents" as View, label: "Dossiers", icon: FileText },
          { view: "__menu" as const, label: "Menu", icon: Menu },
        ] as const).map((item) => (
          <button
            key={item.label}
            onClick={() => item.view === "__menu" ? setMenuOpen(true) : setView(item.view as View)}
            className={`flex flex-col items-center gap-1 py-2.5 text-[10px] ${
              item.view !== "__menu" && (view === item.view || (view === "incident" && item.view === "incidents"))
                ? "text-primary"
                : "text-muted-foreground"
            }`}
            aria-label={item.label}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
