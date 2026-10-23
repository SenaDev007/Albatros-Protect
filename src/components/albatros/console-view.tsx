// Agent Albatros — console opérationnelle (§4.4) : statuts, métadonnées, audit — sans cartes précises
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import { StatusBadge, FormatDateTime, HonestyNote } from "./shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { OBSERVATION_SOURCES, INCIDENT_STATUSES, formatAgo, type IncidentStatus, type ObservationSource } from "@/lib/albatros";
import type { AuditEntry, ConsoleIncident, ConsoleStats, PrivacyRequestItem } from "./types";
import {
  Terminal, Siren, Activity, ScrollText, Loader2, ChevronRight, ShieldAlert, Handshake,
} from "lucide-react";

const STAFF_STATUSES = [
  "verification_required", "ready_to_transmit", "transmitted", "processing",
  "response_received", "closed", "disputed",
];

export function ConsoleView() {
  const { toast } = useToast();
  const { refreshKey, user } = useAlbatros();
  const [incidents, setIncidents] = useState<ConsoleIncident[] | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyRequestItem[]>([]);
  const [stats, setStats] = useState<ConsoleStats | null>(null);
  const [audit, setAudit] = useState<AuditEntry[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadIncidents = () =>
    api.consoleIncidents()
      .then((r) => { setIncidents(r.incidents); setPrivacy(r.privacyRequests); })
      .catch(() => setIncidents([]));

  useEffect(() => { loadIncidents();   }, [refreshKey]);

  const loadStats = () => api.consoleStats().then(setStats).catch(() => setStats(null));
  const loadAudit = () => api.audit().then((r) => setAudit(r.events)).catch(() => setAudit([]));

  const setStatus = async (inc: ConsoleIncident, status: string) => {
    setBusyId(inc.id);
    let note: string | undefined;
    if (status === "closed") note = window.prompt("Motif de clôture (journalisé) :") ?? undefined;
    if (status === "transmitted" || status === "processing") {
      note = window.prompt("Note de transmission (convention active requise — démo) :") ?? undefined;
    }
    try {
      await api.consoleSetStatus(inc.id, status, note);
      toast({
        title: "Statut mis à jour",
        description: `${inc.refNumber} → ${INCIDENT_STATUSES[status as IncidentStatus]?.label}. Action journalisée avec motif (F-075).`,
      });
      loadIncidents();
    } catch (e) {
      toast({ title: "Transition refusée", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusyId(null); }
  };

  if (user?.role !== "admin" && user?.role !== "support") {
    return (
      <div className="rounded-xl border border-red-200 bg-[#FFF0F1] dark:border-red-900/40 dark:bg-red-950/10 p-6">
        <ShieldAlert className="h-6 w-6 text-red-400" />
        <h2 className="mt-3 font-semibold text-[#B91F2B] dark:text-red-300">Accès réservé</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          La console opérationnelle est réservée au personnel habilité. En production, ces rôles sont
          nominatifs, protégés par MFA et séparés des comptes citoyens (§6.4, §13.2).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-bold md:text-3xl">
          <Terminal className="h-7 w-7 text-primary" /> Console opérationnelle
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gestion des signalements et du support — les agents ne consultent pas les positions précises par défaut (§6.4).
        </p>
      </div>

      <Tabs defaultValue="dossiers" onValueChange={(v) => {
        if (v === "stats" && !stats) loadStats();
        if (v === "audit" && !audit) loadAudit();
      }}>
        <TabsList className="bg-secondary/40">
          <TabsTrigger value="dossiers" className="gap-2"><Siren className="h-4 w-4" /> Dossiers</TabsTrigger>
          <TabsTrigger value="stats" className="gap-2"><Activity className="h-4 w-4" /> Indicateurs</TabsTrigger>
          <TabsTrigger value="audit" className="gap-2"><ScrollText className="h-4 w-4" /> Journal d&apos;audit</TabsTrigger>
          <TabsTrigger value="privacy" className="gap-2"><Handshake className="h-4 w-4" /> Droits</TabsTrigger>
        </TabsList>

        {/* Dossiers */}
        <TabsContent value="dossiers" className="mt-4">
          {!incidents ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : incidents.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Aucun dossier dans la base pilote.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b border-border bg-secondary/60 text-xs text-muted-foreground backdrop-blur">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Référence</th>
                      <th className="px-4 py-3 text-left font-medium">Propriétaire</th>
                      <th className="px-4 py-3 text-left font-medium">Appareil</th>
                      <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Déclaré</th>
                      <th className="px-4 py-3 text-left font-medium">Statut</th>
                      <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Obs.</th>
                      <th className="px-4 py-3 text-left font-medium">Transition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((i) => (
                      <tr key={i.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-primary" />
                            <span className="font-mono text-xs">{i.refNumber}</span>
                          </div>
                          <div className="mt-0.5 text-[11px] text-muted-foreground">{i.type === "theft" ? "Vol" : "Perte"} · {i.locationText}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-xs">{i.owner.fullName}</div>
                          <div className="text-[11px] text-muted-foreground">{i.owner.phone ?? i.owner.email}</div>
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {i.device.brand} {i.device.model}
                          <div className="text-[11px] text-muted-foreground font-mono">{i.device.deviceId}</div>
                        </td>
                        <td className="hidden px-4 py-3 text-xs text-muted-foreground md:table-cell">
                          <FormatDateTime date={i.declaredAt} pattern="d MMM HH:mm" />
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                        <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">
                          {i.observationsCount} · {i.eventsCount} évts
                          {i.policeReportRef && <div className="text-[11px] text-emerald-600 dark:text-emerald-300">plainte: {i.policeReportRef}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={i.status}
                            onValueChange={(v) => setStatus(i, v)}
                            disabled={busyId === i.id}
                          >
                            <SelectTrigger className="h-8 w-44 text-xs">
                              {busyId === i.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <SelectValue />}
                            </SelectTrigger>
                            <SelectContent>
                              {STAFF_STATUSES.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {INCIDENT_STATUSES[s as IncidentStatus]?.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <HonestyNote>
            Vue support : statuts et métadonnées uniquement. L&apos;accès aux positions détaillées exige une finalité
            précise, une habilitation nominative et reste journalisé — il n&apos;existe pas d&apos;accès général à la
            carte (§6.4, §13.2).
          </HonestyNote>
        </TabsContent>

        {/* Indicateurs */}
        <TabsContent value="stats" className="mt-4">
          {!stats ? (
            <div className="flex justify-center py-12"><Button onClick={loadStats} variant="outline">Charger les indicateurs</Button></div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { l: "comptes", v: stats.totals.users },
                  { l: "appareils actifs", v: stats.totals.active_devices },
                  { l: "incidents", v: stats.totals.incidents },
                  { l: "dossiers ouverts", v: stats.totals.open_incidents },
                  { l: "dossiers clôturés", v: stats.totals.closed_incidents },
                  { l: "appareils retrouvés (déclarés)", v: stats.totals.retrieved_devices },
                  { l: "rencontres BLE", v: stats.totals.ble_encounters },
                  { l: "demandes de droits", v: stats.totals.privacy_requests },
                ].map((k) => (
                  <div key={k.l} className="rounded-xl border border-border bg-card p-4">
                    <div className="text-2xl font-bold text-primary">{k.v}</div>
                    <div className="text-xs text-muted-foreground">{k.l}</div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold">Dossiers par statut</h3>
                  <div className="mt-4 space-y-2">
                    {Object.entries(stats.incidents_by_status).map(([s, n]) => (
                      <div key={s} className="flex items-center gap-3">
                        <div className="w-40 text-xs text-muted-foreground">{INCIDENT_STATUSES[s as IncidentStatus]?.label ?? s}</div>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, (n / Math.max(1, stats.totals.incidents)) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-sm font-semibold">Observations par source</h3>
                  <div className="mt-4 space-y-2">
                    {Object.entries(stats.observations_by_source).map(([s, n]) => {
                      const cfg = OBSERVATION_SOURCES[s as ObservationSource];
                      const total = Object.values(stats.observations_by_source).reduce((a, b) => a + b, 0);
                      return (
                        <div key={s} className="flex items-center gap-3">
                          <div className="flex w-40 items-center gap-2 text-xs text-muted-foreground">
                            <span className="h-2 w-2 rounded-full" style={{ background: cfg?.color ?? "#a1a1aa" }} />
                            {cfg?.short ?? s}
                          </div>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${(n / Math.max(1, total)) * 100}%`, background: cfg?.color ?? "#a1a1aa" }}
                            />
                          </div>
                          <span className="text-xs font-medium">{n}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5">
                <h3 className="text-sm font-semibold">Consentements par finalité</h3>
                <div className="mt-3 flex flex-wrap gap-3">
                  {Object.entries(stats.consents_by_purpose).map(([p, c]) => (
                    <div key={p} className="rounded-lg bg-secondary/40 px-3 py-2 text-xs">
                      <span className="text-muted-foreground">{p} :</span>{" "}
                      <strong className="text-emerald-600 dark:text-emerald-300">{c.granted} actifs</strong>
                      {c.revoked > 0 && <>, <span className="text-[#B91F2B] dark:text-red-300">{c.revoked} révoqués</span></>}
                    </div>
                  ))}
                </div>
              </div>

              <HonestyNote>
                Indicateurs de pilotage (CDC §5.2). Aucun indicateur n&apos;incite à élargir la collecte de positions
                au-delà du nécessaire : les valeurs-cibles seront fixées après étude de référence et accord des partenaires.
              </HonestyNote>
            </div>
          )}
        </TabsContent>

        {/* Audit */}
        <TabsContent value="audit" className="mt-4">
          {!audit ? (
            <div className="flex justify-center py-12"><Button onClick={loadAudit} variant="outline">Charger le journal</Button></div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 border-b border-border bg-secondary/60 text-xs text-muted-foreground backdrop-blur">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Acteur</th>
                      <th className="px-4 py-3 text-left font-medium">Action</th>
                      <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Objet</th>
                      <th className="hidden px-4 py-3 text-left font-medium sm:table-cell">Motif</th>
                      <th className="px-4 py-3 text-left font-medium">Résultat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.map((e) => (
                      <tr key={e.id} className="border-b border-border/50 last:border-0">
                        <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                          <FormatDateTime date={e.createdAt} pattern="d MMM HH:mm:ss" />
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">{e.actorRole}</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs">{e.action}</td>
                        <td className="hidden px-4 py-2.5 text-xs text-muted-foreground md:table-cell">
                          {e.objectType}{e.objectId ? ` · ${e.objectId.slice(0, 8)}…` : ""}
                        </td>
                        <td className="hidden max-w-64 truncate px-4 py-2.5 text-xs text-muted-foreground sm:table-cell">{e.reason ?? "—"}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs ${e.result === "success" ? "text-emerald-600 dark:text-emerald-300" : "text-[#B91F2B] dark:text-red-300"}`}>{e.result}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <HonestyNote>
            Journal <code>append-only</code> protégé : aucune coordonnée précise ni identifiant complet n&apos;y est
            inscrit (§13.3). Les analyses d&apos;incident font l&apos;objet d&apos;un accès temporaire audité.
          </HonestyNote>
        </TabsContent>

        {/* Droits */}
        <TabsContent value="privacy" className="mt-4">
          {privacy.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Aucune demande d&apos;exercice de droits.
            </p>
          ) : (
            <div className="space-y-2">
              {privacy.map((p) => (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <div className="text-sm font-medium capitalize">{p.type}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{p.details}</div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <FormatDateTime date={p.createdAt} pattern="d MMM yyyy" />
                    <StatusBadge status={p.status === "done" ? "closed" : p.status === "processing" ? "processing" : "submitted"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
