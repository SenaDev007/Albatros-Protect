// Agent Albatros — tableau de bord citoyen
"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useAlbatros, type View } from "./store";
import {
  SourceBadge, StatusBadge, FreshnessTag, EmptyState, HonestyNote, FormatDateTime,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { readinessScore } from "@/lib/albatros";
import type { Device, Incident, Observation } from "./types";
import {
  Smartphone, Tablet, Laptop, Monitor, Siren, Map as MapIcon, Plus,
  ShieldCheck, Signal, ArrowRight, SearchX, FileText, ClipboardList,
} from "lucide-react";

export const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  smartphone: Smartphone, tablet: Tablet, laptop: Laptop, desktop: Monitor,
};

export function DashboardView() {
  const { user, setView, openIncident, refreshKey } = useAlbatros();
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [incidents, setIncidents] = useState<Incident[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, i] = await Promise.all([api.devices(), api.incidents()]);
        if (alive) { setDevices(d.devices); setIncidents(i.incidents); }
      } catch {
        if (alive) { setDevices([]); setIncidents([]); }
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  const openIncidents = (incidents ?? []).filter((i) => !["closed", "draft"].includes(i.status));
  const avgReadiness = devices?.length
    ? Math.round(devices.reduce((acc, d) => acc + readinessScore(d), 0) / devices.length)
    : 0;
  const allObs: Observation[] = (devices ?? [])
    .map((d) => d.lastObservation)
    .filter((o): o is Observation => !!o)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

  // §6.3 — Actions recommandées : chaque recommandation est liée à une règle réelle
  // du système (jamais générée pour remplir l'interface).
  type Reco = { id: string; icon: React.ComponentType<{ className?: string }>; text: string; go: View; };
  const recommendations: Reco[] = [];
  for (const d of devices ?? []) {
    if (d.openIncident && !d.policeReportRef) recommendations.push({
      id: `r-police-${d.id}`, icon: Siren,
      text: `Ajouter la référence de plainte au dossier ${d.openIncident.refNumber}.`, go: "incidents",
    });
    if (!d.enrolled && !d.openIncident) recommendations.push({
      id: `r-enroll-${d.id}`, icon: ShieldCheck,
      text: `Terminer la préparation de « ${d.brand} ${d.model} » : l'agent n'est pas encore enrôlé.`, go: "preparation",
    });
    if (d.enrolled && !d.proofUploaded) recommendations.push({
      id: `r-proof-${d.id}`, icon: FileText,
      text: `Ajouter une preuve de propriété pour « ${d.brand} ${d.model} ».`, go: "steps",
    });
    if (d.enrolled && !d.identifiersComplete) recommendations.push({
      id: `r-ident-${d.id}`, icon: Smartphone,
      text: `Compléter les identifiants de « ${d.brand} ${d.model} » (IMEI, n° de série ou référence).`, go: "devices",
    });
  }

  return (
    <div className="space-y-8">
      {/* Salutation */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Bonjour {user?.fullName?.split(" ")[0] ?? ""} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre inventaire protégé et vos dossiers, en un coup d&apos;œil.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setView("devices")}>
            <Plus className="h-4 w-4" /> Ajouter un appareil
          </Button>
          <Button className="bg-primary hover:bg-primary/90" onClick={() => setView("incidents")}>
            <Siren className="h-4 w-4" /> Signaler
          </Button>
        </div>
      </div>

      {/* Alerte incident en cours */}
      {openIncidents.length > 0 && (
        <div className="rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/20">
                <Siren className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">Incident en cours — {openIncidents[0].refNumber}</span>
                  <StatusBadge status={openIncidents[0].status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {openIncidents[0].type === "theft" ? "Vol" : "Perte"} ·{" "}
                  {openIncidents[0].device?.brand} {openIncidents[0].device?.model}
                  {openIncidents[0].lastObservation && (
                    <> · dernière position <FreshnessTag capturedAt={openIncidents[0].lastObservation.capturedAt} accuracyM={openIncidents[0].lastObservation.accuracyRadiusM} /></>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => openIncident(openIncidents[0].id)}>Voir le dossier</Button>
              <Button onClick={() => setView("map")} className="bg-primary hover:bg-primary/90">
                <MapIcon className="h-4 w-4" /> Carte
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* §6.3 — Indicateurs principaux */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {([
          { icon: Smartphone, v: devices?.length ?? "—", l: "appareils enregistrés", go: "devices" as View },
          { icon: ShieldCheck, v: devices ? `${avgReadiness} %` : "—", l: "préparation moyenne", go: "preparation" as View },
          { icon: Siren, v: openIncidents.length, l: "dossier(s) ouvert(s)", go: "incidents" as View },
          { icon: Signal, v: allObs.length, l: "dernières observations", go: "map" as View },
        ] as const).map((k) => (
          <button key={k.l} onClick={() => setView(k.go)} className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40">
            <k.icon className="h-4 w-4 text-primary" />
            <div className="mt-2 text-2xl font-bold">{k.v}</div>
            <div className="text-xs text-muted-foreground">{k.l}</div>
          </button>
        ))}
      </div>

      {/* Appareils */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Mes appareils</h2>
          <button onClick={() => setView("devices")} className="flex items-center gap-1 text-sm text-primary hover:underline">
            Gérer <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
        {!devices ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-36 rounded-xl" /> <Skeleton className="h-36 rounded-xl" />
          </div>
        ) : devices.length === 0 ? (
          <EmptyState
            icon={Smartphone}
            title="Aucun appareil enregistré"
            hint="Créez votre inventaire privé avant qu'un incident ne survienne : c'est la meilleure protection."
            action={<Button onClick={() => setView("devices")} className="bg-primary hover:bg-primary/90">Ajouter mon premier appareil</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {devices.map((d) => {
              const Icon = CATEGORY_ICON[d.category] ?? Smartphone;
              const score = readinessScore(d);
              return (
                <button
                  key={d.id}
                  onClick={() => setView("devices")}
                  className="group rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10">
                        <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                      </div>
                      <div>
                        <div className="font-medium leading-tight">{d.brand} {d.model}</div>
                        <div className="text-xs text-muted-foreground">
                          {d.osName} {d.osVersion} · {d.deviceId}
                        </div>
                      </div>
                    </div>
                    {d.openIncident ? <StatusBadge status={d.openIncident.status} /> : (
                      d.enrolled
                        ? <span className="rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300">agent actif</span>
                        : <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">non enrôlé</span>
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <Progress value={score} className="h-1.5 flex-1 [&>div]:bg-primary" />
                    <span className="text-xs text-muted-foreground">{score}%</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {d.lastTransmissionAt
                        ? <>Agent vu <FreshnessTag capturedAt={d.lastTransmissionAt} /></>
                        : "Aucune transmission reçue"}
                    </span>
                    {d.lastObservation && <SourceBadge source={d.lastObservation.source} short />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* §6.3 — Activité récente */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Activité récente</h2>
        </div>
        {!devices ? (
          <Skeleton className="h-40 rounded-xl" />
        ) : allObs.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Aucune observation pour l'instant"
            hint="Les positions apparaissent ici dès que l'application/agent de l'appareil transmet, ou qu'une détection communautaire a lieu. Aucune position n'est inventée."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-secondary/30 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Appareil</th>
                    <th className="px-4 py-2.5 text-left font-medium">Source</th>
                    <th className="hidden px-4 py-2.5 text-left font-medium sm:table-cell">Fraîcheur</th>
                    <th className="hidden px-4 py-2.5 text-left font-medium md:table-cell">Collecte</th>
                  </tr>
                </thead>
                <tbody>
                  {allObs.slice(0, 8).map((o) => {
                    const device = devices.find((d) => d.id === o.deviceId);
                    return (
                      <tr key={o.id} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-3">{device ? `${device.brand} ${device.model}` : o.deviceId}</td>
                        <td className="px-4 py-3"><SourceBadge source={o.source} /></td>
                        <td className="hidden px-4 py-3 sm:table-cell">
                          <FreshnessTag capturedAt={o.capturedAt} accuracyM={o.accuracyRadiusM} />
                        </td>
                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                          <FormatDateTime date={o.capturedAt} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* §6.3 — Actions recommandées (règles réelles uniquement) */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Actions recommandées</h2>
          <button onClick={() => setView("steps")} className="flex items-center gap-1 text-sm text-primary hover:underline">
            <ClipboardList className="h-3.5 w-3.5" /> Toutes les démarches
          </button>
        </div>
        {recommendations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 px-6 py-8 text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-emerald-500" />
            <p className="mt-3 text-sm font-medium">Tout est en ordre</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Vos appareils sont préparés et vos dossiers à jour. Aucune recommandation active —
              les prochaines apparaîtront selon l&apos;état réel de votre compte.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recommendations.slice(0, 4).map((r) => (
              <button
                key={r.id}
                onClick={() => setView(r.go)}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-950/40">
                  <r.icon className="h-4 w-4 text-orange-600 dark:text-orange-300" />
                </div>
                <span className="flex-1 text-sm">{r.text}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}
      </section>

      <HonestyNote>
        Les positions affichées proviennent de sources réelles (appareil, estimation Wi-Fi/cellulaire, détection
        Bluetooth, partenaire habilité) avec leur heure et leur précision. Si aucune source n&apos;existe,
        rien n&apos;est affiché — c&apos;est le contrat de transparence du service (§4.1 du cahier des charges).
      </HonestyNote>
    </div>
  );
}
