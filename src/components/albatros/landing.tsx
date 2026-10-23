// Agent Albatros — page publique (vision du service, transparence, partenaires)
"use client";

import { useAlbatros } from "./store";
import { AlbatrosLogo, AlbatrosMark, HonestyNote } from "./shared";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, Smartphone, Radio, Users, FileText, MapPin, BellRing,
  Handshake, Lock, Landmark, Scale, ChevronRight,
} from "lucide-react";

export function LandingView() {
  const setView = useAlbatros((s) => s.setView);

  return (
    <div className="flex min-h-screen flex-col">
      <div className="hero-grid relative flex-1">
        {/* En-tête */}
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <AlbatrosLogo />
          <nav className="hidden gap-6 text-sm text-muted-foreground md:flex">
            <a href="#fonctionnement" className="hover:text-foreground transition-colors">Fonctionnement</a>
            <a href="#transparence" className="hover:text-foreground transition-colors">Transparence</a>
            <a href="#partenaires" className="hover:text-foreground transition-colors">Partenaires</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setView("auth")}>Se connecter</Button>
            <Button onClick={() => setView("auth")} className="bg-primary hover:bg-primary/90">
              Créer un compte
            </Button>
          </div>
        </header>

        {/* Héro */}
        <section className="mx-auto w-full max-w-6xl px-6 pb-16 pt-10 md:pt-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            <MapPin className="h-3.5 w-3.5" />
            Pilote — Parakou, République du Bénin
          </div>
          <h1 className="albatros-glow mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight md:text-6xl">
            Protéger. Localiser. <span className="text-primary">Récupérer.</span>
          </h1>
          <p className="mt-3 text-sm font-medium uppercase tracking-[0.3em] text-muted-foreground">
            Albatros Protect
          </p>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Albatros Protect aide les citoyens à préparer leurs appareils avant l&apos;incident, à signaler
            rapidement une perte ou un vol, et à suivre leurs démarches auprès des opérateurs et des autorités —
            avec une localisation <strong className="text-foreground">honnête</strong> : chaque position affiche
            sa source, son heure et sa précision réelle. Jamais de promesse impossible.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" onClick={() => setView("auth")} className="bg-primary hover:bg-primary/90">
              Protéger mes appareils
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => setView("auth")}>
              J&apos;ai déjà un compte
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Compte de démonstration : <code className="rounded bg-secondary px-1.5 py-0.5">+22997000001</code> — le code
            de vérification s&apos;affiche à l&apos;écran en mode pilote.
          </p>
        </section>

        {/* Chiffres clés */}
        <section className="mx-auto grid w-full max-w-6xl grid-cols-2 gap-4 px-6 pb-16 md:grid-cols-4">
          {[
            { v: "5", l: "familles de plateformes couvertes (Android, iOS, Windows, macOS, Linux)" },
            { v: "4", l: "types de sources de position distinguées avec leur incertitude" },
            { v: "0", l: "position fabriquée — aucune donnée extrapolée" },
            { v: "100 %", l: "des actions sensibles protégées par vérification renforcée" },
          ].map((s) => (
            <div key={s.l} className="rounded-xl border border-border bg-card/60 p-5">
              <div className="text-3xl font-bold text-primary">{s.v}</div>
              <div className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </section>
      </div>

      {/* Fonctionnement */}
      <section id="fonctionnement" className="mx-auto w-full max-w-6xl px-6 py-16">
        <h2 className="text-2xl font-bold md:text-3xl">Comment ça marche</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Un point d&apos;entrée unique pour toutes vos démarches, avant comme après l&apos;incident.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Smartphone,
              t: "1. Préparer",
              d: "Créez votre inventaire privé : appareils, IMEI, numéros de série, preuves d'achat chiffrées. L'assistant de préparation active les permissions utiles et vous explique honnêtement les limites.",
            },
            {
              icon: BellRing,
              t: "2. Signaler",
              d: "Perte ou vol : un parcours guidé crée votre dossier horodaté avec numéro de référence, liste d'actions immédiates (SIM, comptes, plainte) et récapitulatif exportable.",
            },
            {
              icon: Radio,
              t: "3. Suivre",
              d: "Consultez les positions réellement disponibles — de l'appareil, d'une estimation Wi-Fi/cellulaire, d'une détection Bluetooth communautaire ou d'un partenaire habilité — et suivez chaque réponse.",
            },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mt-4 font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {[
            { icon: MapPin, t: "Localisation conditionnelle", d: "Source, heure de collecte et rayon de précision affichés pour chaque position. Une détection Bluetooth montre la position du téléphone détecteur, pas un GPS de votre appareil." },
            { icon: Users, t: "Cercles de confiance", d: "Alertez vos proches sans leur donner accès à vos positions. Les partages sont explicites, limités dans le temps et révocables à tout moment." },
            { icon: FileText, t: "Dossier exportable", d: "Générez un récapitulatif horodaté de vos déclarations et preuves pour vos échanges avec l'opérateur ou les autorités. Ce n'est pas un procès-verbal officiel." },
            { icon: Lock, t: "Identifiants protégés", d: "IMEI et numéros de série sont chiffrés au repos, masqués dans l'interface et jamais exposés dans les journaux. La connaissance d'un IMEI ne donne aucun contrôle sur un dossier." },
            { icon: ShieldCheck, t: "Consentement maîtrisé", d: "Vous choisissez ce qui est activé : localisation, participation au réseau de détection, partages. Tout est révocable immédiatement, sans perdre l'accès à votre inventaire." },
            { icon: Handshake, t: "Complémentaire", d: "L'application utilise les API publiques de chaque système. Aucun accès aux réseaux privés Find My / Find Hub : les outils fabricants restent externes, à votre initiative." },
          ].map((c) => (
            <div key={c.t} className="rounded-xl border border-border bg-card p-6">
              <c.icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-semibold">{c.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Transparence */}
      <section id="transparence" className="border-y border-border bg-secondary/40">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <div className="flex items-center gap-3">
            <Scale className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold md:text-3xl">Ce que nous ne ferons jamais</h2>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            La confiance exige des limites explicites, inscrites dans le produit lui-même.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "Aucune promesse de localisation en direct d'un appareil éteint, réinitialisé ou sans batterie.",
              "Aucune photo clandestine : la capture dissimulée d'un visage est exclue du pilote, sans exception.",
              "Aucune publication publique d'IMEI, de numéros de série ou de positions.",
              "Aucun suivi d'une personne : la recherche par numéro ou IMEI ne donne accès à aucune position d'abonné.",
              "Aucun conseil de confrontation : l'interface oriente toujours vers les autorités en cas de risque.",
              "Aucune transmission aux opérateurs ou aux autorités sans convention signée et cadre légal validé.",
            ].map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-3.5">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-sm leading-relaxed text-muted-foreground">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partenaires */}
      <section id="partenaires" className="mx-auto w-full max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <Landmark className="h-6 w-6 text-primary" />
          <h2 className="text-2xl font-bold md:text-3xl">Un ancrage béninois</h2>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Le service est conçu pour le Bénin. Les partenariats sont en cours de discussion —
          aucun n&apos;est présumé acquis, et aucune demande n&apos;est transmise avant signature.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { n: "ARCEP Bénin", d: "Cadrage réglementaire et sectoriel", s: "En discussion" },
            { n: "MTN Bénin", d: "Suspension SIM, vérification IMEI", s: "En discussion" },
            { n: "Moov Africa Bénin", d: "Suspension SIM, vérification IMEI", s: "En discussion" },
            { n: "Celtiis (SBIN)", d: "Suspension SIM, vérification IMEI", s: "En discussion" },
            { n: "APDP", d: "Formalités de protection des données personnelles", s: "Cadrage préalable" },
            { n: "Police / Justice (Parakou)", d: "Parcours de plainte et pièces requises", s: "À valider" },
          ].map((p) => (
            <div key={p.n} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{p.n}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{p.d}</div>
                </div>
                <span className="whitespace-nowrap rounded-full border border-border bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {p.s}
                </span>
              </div>
            </div>
          ))}
        </div>
        <HonestyNote variant="warn">
          <strong>Statut pilote :</strong> ce portail utilise des données de démonstration. Les parcours
          opérateurs et autorités sont inactifs (aucune convention signée à ce jour), les positions affichées
          sont simulées et le code de vérification s&apos;affiche à l&apos;écran. Aucune donnée réelle de citoyen
          n&apos;est traitée.
        </HonestyNote>

        <div className="mt-12 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/15 via-transparent to-transparent p-8 md:p-12">
          <AlbatrosMark size={40} />
          <h3 className="mt-4 text-2xl font-bold md:text-3xl">Prêt à protéger vos appareils ?</h3>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            L&apos;inscription prend deux minutes : un numéro vérifiable suffit. Vous gardez le contrôle total
            sur chaque fonctionnalité.
          </p>
          <Button size="lg" onClick={() => setView("auth")} className="mt-6 bg-primary hover:bg-primary/90">
            Créer mon compte
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Pied de page (sticky) */}
      <footer className="mt-auto border-t border-border bg-card/40">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <AlbatrosMark size={22} />
            <span>Albatros Protect — pilote Parakou, République du Bénin</span>
          </div>
          <div className="flex flex-wrap gap-5">
            <span>Code du numérique (Loi n° 2017-20) · formalités APDP en cours</span>
            <span>© {new Date().getFullYear()} Albatros Protect</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
