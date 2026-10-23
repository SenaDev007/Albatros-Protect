// Albatros Protect — Centre d'aide (§13.1 : FAQ honnête, limites visibles)
"use client";

import { useAlbatros } from "./store";
import { HonestyNote } from "./shared";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { LifeBuoy, ShieldCheck, MapPin, Smartphone, Lock, Users, Scale } from "lucide-react";

const FAQ = [
  {
    q: "Que peut réellement faire Albatros Protect ?",
    a: "Le service vous aide à préparer vos appareils avant un incident (inventaire, identifiants, preuves, permissions), à signaler rapidement une perte ou un vol, à consulter les observations de localisation réellement disponibles avec leur source, leur heure et leur précision, et à suivre vos démarches. La confiance du service repose sur la transparence : chaque information affichée est traçable.",
  },
  {
    q: "Mon téléphone éteint peut-il être localisé ?",
    a: "Non. Un appareil éteint, sans batterie, réinitialisé ou dont l'application a été désinstallée ne peut plus transmettre sa position ni son signal Bluetooth. Dans ce cas, le service affiche la dernière position connue avec son horodatage — sans conclure automatiquement à un vol ni à une extinction volontaire. Aucune promesse de localisation temps réel ne doit être comprise au-delà de ce que les sources fournissent.",
  },
  {
    q: "Qu'est-ce qu'une détection Bluetooth à proximité ?",
    a: "Si votre appareil participait au réseau communautaire, un téléphone participant à proximité a pu détecter son identifiant temporaire. La position affichée est celle du téléphone détecteur, pas un GPS de votre appareil : c'est un indice de proximité, avec son heure et une précision limitée.",
  },
  {
    q: "L'IMEI localise-t-il mon appareil ?",
    a: "Non. L'IMEI identifie l'équipement auprès des réseaux ; il ne fournit aucune position. Un blocage IMEI dépend des opérateurs concernés et de leur participation, et le service n'effectue aucune localisation par IMEI de sa propre initiative. La connaissance d'un IMEI ne donne en outre aucun contrôle sur un dossier.",
  },
  {
    q: "Le service accède-t-il à Find My (Apple) ou Find Hub (Google) ?",
    a: "Non. Ces réseaux privés restent hors périmètre. L'application utilise uniquement les API publiques de localisation et Bluetooth du système, avec vos permissions. Les outils officiels des fabricants peuvent être ouverts en services externes, à votre initiative — la plateforme n'en récupère aucune donnée.",
  },
  {
    q: "Qui peut voir la position de mes appareils ?",
    a: "Vous, et uniquement vous, par défaut. Les membres d'un cercle de confiance ne voient une information que si vous l'avez explicitement partagée, pour une durée déterminée, révocable à tout moment. Le personnel de support n'a pas d'accès général aux positions : toute consultation exceptionnelle est justifiée, limitée et journalisée.",
  },
  {
    q: "Que se passe-t-il si je ne retrouve pas mon appareil ?",
    a: "Votre dossier reste consultable et exportable pour vos démarches officielles. Vous pouvez le clôturer à tout moment ; les éléments requis par une obligation légale éventuelle sont conservés selon les durées publiées. Le service ne promet aucune récupération garantie — il rend vos démarches organisées, vérifiables et honnêtes.",
  },
  {
    q: "Comment mes données personnelles sont-elles protégées ?",
    a: "Les identifiants d'appareils sont chiffrés au repos et masqués dans l'interface. Les positions sont conservées avec des durées limitées, validées avec l'APDP. Vous pouvez révoquer chaque consentement et exercer vos droits (accès, rectification, suppression, opposition) depuis le centre de confidentialité.",
  },
];

export function HelpView() {
  const setView = useAlbatros((s) => s.setView);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Centre d&apos;aide</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Réponses claires sur le fonctionnement réel du service — et sur ses limites.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: ShieldCheck, t: "Préparer", d: "Enregistrez vos appareils, identifiants et preuves avant tout incident." },
          { icon: Smartphone, t: "Signaler", d: "Un parcours guidé crée un dossier horodaté et exportable." },
          { icon: MapPin, t: "Suivre", d: "Consultez les observations réellement disponibles, avec leur provenance." },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border border-border bg-card p-5">
            <c.icon className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-semibold">{c.t}</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <LifeBuoy className="h-5 w-5 text-primary" /> Questions fréquentes
        </h2>
        <Accordion type="single" collapsible className="mt-4">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`q-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" /> Cercles de confiance</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Invitez vos proches, partagez une alerte ou un statut pour une durée déterminée — jamais une
            position permanente. Gérez tout depuis l&apos;onglet Cercles.
          </p>
          <button onClick={() => setView("circles")} className="mt-3 text-xs text-primary hover:underline">
            Gérer mes cercles →
          </button>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="flex items-center gap-2 text-sm font-semibold"><Lock className="h-4 w-4 text-primary" /> Confidentialité et droits</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Consultez et révoquez vos consentements, gérez vos sessions et exercez vos droits sur vos
            données personnelles (Code du numérique, Loi n° 2017-20).
          </p>
          <button onClick={() => setView("settings")} className="mt-3 text-xs text-primary hover:underline">
            Ouvrir le centre de confidentialité →
          </button>
        </div>
      </div>

      <HonestyNote variant="warn">
        <div className="flex items-start gap-2">
          <Scale className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            <strong>Sécurité avant tout :</strong> ne vous rendez jamais seul vers une position et ne
            confrontez jamais un suspect — alertez systématiquement les autorités compétentes. En cas
            de danger immédiat, composez le 117 (police secours — numéro à vérifier localement).
          </span>
        </div>
      </HonestyNote>
    </div>
  );
}
