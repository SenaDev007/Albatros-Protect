// Albatros Protect — Back-office : trois espaces distincts
//  · Espace Système   (admin + support) : pilotage plateforme, comptes, audit, RGPD
//  · Espace GSM       (gsm_operator + admin) : demandes opérateurs, triangulation réseau
//  · Espace Police    (police_officer + admin) : dossiers de vol, plaintes, IMEI
// Coquille dédiée, distincte de l'espace citoyen, routage #/back-office/<espace>.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "./api";
import { useAlbatros, type BoSpace } from "./store";
import { AlbatrosMark, StatusBadge, FormatDateTime, MaskedIdentifier } from "./shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type {
  BoAuditEntry, BoIncident, BoPartnerRequest, BoPrivacyRequest, BoSpaceInfo,
  BoStats, BoUser, TriangulationOverlay,
} from "./types";
import {
  Server, RadioTower, Shield, LogOut, Loader2, Search, Users, Siren, ScrollText,
  LockKeyhole, FileBadge, CheckCircle2, XCircle, Send, MapPin, Wifi, ChevronRight,
  Database, Activity, UserCog, ClipboardList, Fingerprint, Landmark, Eye, CheckCheck,
} from "lucide-react";

// ─────────────────────────── Petits composants ───────────────────────────

const SPACE_META: Record<BoSpace, { label: string; icon: React.ComponentType<{ className?: string }>; accent: string }> = {
  system: { label: "Système", icon: Server, accent: "text-primary" },
  gsm: { label: "GSM", icon: RadioTower, accent: "text-amber-500" },
  police: { label: "Police", icon: Shield, accent: "text-sky-400" },
};

function KpiCard({ label, value, hint, tone }: { label: string; value: number; hint?: string; tone?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        <div className="mt-0.5 text-xs font-medium leading-tight">{label}</div>
        {hint && <div className="mt-0.5 text-[11px] leading-tight text-muted-foreground">{hint}</div>}
        {tone === "warn" && value > 0 && (
          <div className="mt-1 h-1 w-8 rounded-full bg-amber-500" aria-hidden />
        )}
        {tone === "ok" && (
          <div className="mt-1 h-1 w-8 rounded-full bg-emerald-500" aria-hidden />
        )}
      </CardContent>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  );
}

// ─────────────────────────── Espace SYSTÈME ───────────────────────────

const ROLE_LABELS: Record<string, string> = {
  citizen: "Citoyen·ne",
  support: "Support",
  admin: "Administrateur",
  gsm_operator: "Agent opérateur (GSM)",
  police_officer: "Agent Police",
};

function SystemSpace() {
  const { toast } = useToast();
  const { refreshKey } = useAlbatros();
  const [stats, setStats] = useState<BoStats | null>(null);
  const [users, setUsers] = useState<BoUser[] | null>(null);
  const [incidents, setIncidents] = useState<BoIncident[] | null>(null);
  const [audit, setAudit] = useState<BoAuditEntry[] | null>(null);
  const [privacy, setPrivacy] = useState<BoPrivacyRequest[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    api.boStats("system").then((r) => setStats(r)).catch(() => setStats(null));
    api.boIncidents("system").then((r) => setIncidents(r.incidents)).catch(() => setIncidents([]));
    api.boAudit(80).then((r) => setAudit(r.events)).catch(() => setAudit([]));
    api.boPrivacyRequests().then((r) => setPrivacy(r.requests)).catch(() => setPrivacy([]));
  }, [refreshKey]);

  useEffect(() => {
    const t = setTimeout(() => {
      api.boUsers(query).then((r) => setUsers(r.users)).catch(() => setUsers([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query, refreshKey]);

  const changeRole = async (u: BoUser, role: string) => {
    try {
      await api.boUpdateUser(u.id, { role });
      toast({ title: "Rôle mis à jour", description: `${u.fullName} → ${ROLE_LABELS[role] ?? role}. Journal d'audit enrichi.` });
      setUsers((prev) => prev?.map((x) => (x.id === u.id ? { ...x, role } : x)) ?? null);
    } catch (e) {
      toast({ title: "Modification refusée", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    }
  };

  const setPrivacyStatus = async (p: BoPrivacyRequest, status: string) => {
    try {
      await api.boUpdatePrivacyRequest(p.id, status);
      toast({ title: "Demande RGPD mise à jour", description: `${p.type} → ${status}.` });
      setPrivacy((prev) => prev?.map((x) => (x.id === p.id ? { ...x, status } : x)) ?? null);
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    }
  };

  if (!stats) {
    return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;
  }

  return (
    <div className="space-y-8">
      {/* KPI */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        {stats.kpis.map((k) => <KpiCard key={k.key} label={k.label} value={k.value} hint={k.hint} tone={k.tone} />)}
      </div>

      {/* Comptes */}
      <section className="space-y-3">
        <SectionTitle
          icon={Users}
          title="Comptes et rôles"
          action={
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher nom, téléphone, email…" className="pl-9" />
            </div>
          }
        />
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Compte</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Organisation</th>
                    <th className="px-4 py-3 font-medium">Rôle</th>
                    <th className="px-4 py-3 font-medium text-right">Appareils · Dossiers</th>
                  </tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => (
                    <tr key={u.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <div className="font-medium">{u.fullName}</div>
                        <div className="text-[11px] text-muted-foreground">
                          Inscrit le <FormatDateTime date={u.createdAt} pattern="d MMM yyyy" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{u.phone ?? u.email ?? "—"}</td>
                      <td className="px-4 py-3 text-xs">{u.organization ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3">
                        <Select value={u.role} onValueChange={(v) => changeRole(u, v)}>
                          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(ROLE_LABELS).map(([r, l]) => (
                              <SelectItem key={r} value={r} className="text-xs">{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                        {u.devicesCount ?? 0} · {u.incidentsCount ?? 0}
                      </td>
                    </tr>
                  ))}
                  {users && users.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun compte trouvé.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Dossiers */}
      <section className="space-y-3">
        <SectionTitle icon={Siren} title="Supervision des dossiers" />
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Référence</th>
                    <th className="px-4 py-3 font-medium">Propriétaire</th>
                    <th className="px-4 py-3 font-medium">Appareil</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium">Plainte</th>
                    <th className="px-4 py-3 font-medium text-right">Obs.</th>
                  </tr>
                </thead>
                <tbody>
                  {(incidents ?? []).map((i) => (
                    <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold">{i.refNumber}</span>
                        <div className="text-[11px] text-muted-foreground">{i.type === "theft" ? "Vol" : "Perte"} · <FormatDateTime date={i.declaredAt} pattern="d MMM" /></div>
                      </td>
                      <td className="px-4 py-3 text-xs">{i.owner.fullName}<div className="text-[11px] text-muted-foreground">{i.owner.phone ?? i.owner.email}</div></td>
                      <td className="px-4 py-3 text-xs">{i.device ? `${i.device.brand} ${i.device.model}` : "—"}<div className="font-mono text-[10px] text-muted-foreground">{i.device?.deviceId}</div></td>
                      <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                      <td className="px-4 py-3 font-mono text-[11px]">{i.policeReportRef ?? <span className="text-muted-foreground">—</span>}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">{i.observationsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Journal d'audit */}
        <section className="space-y-3">
          <SectionTitle icon={ScrollText} title="Journal d'audit" />
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {(audit ?? []).map((e) => (
                  <div key={e.id} className="flex items-start gap-3 border-b border-border/60 px-4 py-2.5 last:border-0">
                    <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${e.result === "success" ? "bg-emerald-500" : "bg-red-500"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 text-xs">
                        <code className="font-mono font-semibold">{e.action}</code>
                        <span className="text-muted-foreground">· {e.actor?.fullName ?? e.actorRole}</span>
                        <span className="text-[10px] text-muted-foreground"><FormatDateTime date={e.createdAt} pattern="d MMM · HH:mm" /></span>
                      </div>
                      {e.reason && <p className="mt-0.5 truncate text-[11px] text-muted-foreground" title={e.reason}>{e.reason}</p>}
                    </div>
                  </div>
                ))}
                {audit && audit.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucun événement.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Demandes RGPD */}
        <section className="space-y-3">
          <SectionTitle icon={LockKeyhole} title="Demandes d'exercice de droits (RGPD)" />
          <Card>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {(privacy ?? []).map((p) => (
                  <div key={p.id} className="border-b border-border/60 px-4 py-3 last:border-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-semibold">
                        {p.type === "access" ? "Accès" : p.type === "rectification" ? "Rectification" : p.type === "deletion" ? "Suppression" : "Opposition"}
                        <span className="ml-2 font-normal text-muted-foreground">{p.user.fullName}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        p.status === "done" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : p.status === "processing" ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-secondary text-muted-foreground"}`}>
                        {p.status === "done" ? "traitée" : p.status === "processing" ? "en cours" : "reçue"}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{p.details}</p>
                    <div className="mt-2 flex gap-2">
                      {p.status !== "processing" && p.status !== "done" && (
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => setPrivacyStatus(p, "processing")}>
                          Prendre en charge
                        </Button>
                      )}
                      {p.status !== "done" && (
                        <Button size="sm" className="h-7 bg-primary text-[11px] hover:bg-primary/90" onClick={() => setPrivacyStatus(p, "done")}>
                          <CheckCheck className="h-3 w-3" /> Marquer traitée
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {privacy && privacy.length === 0 && (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">Aucune demande.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

// ─────────────────────────── Carte de triangulation (mini) ───────────────────────────

function TriangulationMiniMap({ tri }: { tri: TriangulationOverlay | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        center: [9.3433, 2.6089], zoom: 13, zoomControl: false, attributionControl: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 20,
      }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    })();
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const map = mapRef.current;
      if (!L || !map || !tri) return;
      // Nettoyage : recrée le groupe de couches à chaque rendu
      map.eachLayer((layer) => {
        if ((layer as unknown as { options?: { attribution?: string } }).options?.attribution === undefined) map.removeLayer(layer);
      });
      const group = L.layerGroup().addTo(map);
      for (const a of tri.anchors) {
        const color = a.kind === "cell" ? "#F59E0B" : "#38BDF8";
        L.circle([a.lat, a.lng], {
          radius: a.distance_m, color, weight: 1.5, opacity: 0.65, dashArray: "5 7", fill: false,
        }).addTo(group);
        L.circleMarker([a.lat, a.lng], {
          radius: 5, color, weight: 2, fillColor: color, fillOpacity: 0.95,
        }).addTo(group).bindTooltip(`${a.label} · ${a.rssi} dBm · ${a.distance_m} m`, { direction: "top" });
        L.polyline([[a.lat, a.lng], [tri.center.lat, tri.center.lng]], {
          color, weight: 1.2, opacity: 0.45, dashArray: "2 6",
        }).addTo(group);
      }
      L.circle([tri.center.lat, tri.center.lng], {
        radius: tri.accuracy_radius_m, color: "#E53945", weight: 2, opacity: 0.9, fillColor: "#E53945", fillOpacity: 0.12,
      }).addTo(group);
      L.circleMarker([tri.center.lat, tri.center.lng], {
        radius: 7, color: "#E53945", weight: 3, fillColor: "#E53945", fillOpacity: 0.7,
      }).addTo(group).bindTooltip("Position triangulée", { direction: "top" });
      // Cadre englobant toutes les ancres + le centre → tout est visible
      const pts = [...tri.anchors.map((a) => [a.lat, a.lng] as [number, number]), [tri.center.lat, tri.center.lng]];
      map.fitBounds(L.latLngBounds(pts).pad(0.25), { animate: true, duration: 0.6 });
    })();
  }, [tri]);

  return (
    <div className="relative h-64 overflow-hidden rounded-xl border border-border">
      <div ref={containerRef} className="h-full w-full" />
      {!tri && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/60 text-xs text-muted-foreground">
          <MapPin className="h-5 w-5" />
          Lancez la triangulation pour visualiser le résultat
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Espace GSM ───────────────────────────

const REQUEST_TYPE_LABELS: Record<string, string> = {
  sim_suspension: "Suspension SIM",
  imei_block: "Blocage IMEI",
  network_location: "Localisation réseau",
};

function GsmSpace() {
  const { toast } = useToast();
  const { refreshKey } = useAlbatros();
  const [stats, setStats] = useState<BoStats | null>(null);
  const [requests, setRequests] = useState<BoPartnerRequest[] | null>(null);
  const [dialog, setDialog] = useState<null | { req: BoPartnerRequest; action: "answer" | "refuse" }>(null);
  const [note, setNote] = useState("");
  const [withPosition, setWithPosition] = useState(true);
  const [triPreview, setTriPreview] = useState<TriangulationOverlay | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.boStats("gsm").then((r) => setStats(r)).catch(() => setStats(null));
    api.boPartnerRequests("gsm").then((r) => setRequests(r.requests)).catch(() => setRequests([]));
  };
  useEffect(load, [refreshKey]);

  const transmit = async (req: BoPartnerRequest) => {
    setBusy(true);
    try {
      await api.boUpdatePartnerRequest(req.id, { action: "transmit" });
      toast({ title: "Demande transmise", description: `${req.incident.refNumber} — la demande est maintenant dans la file de traitement.` });
      load();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const submit = async () => {
    if (!dialog) return;
    setBusy(true);
    try {
      const res = await api.boUpdatePartnerRequest(dialog.req.id, {
        action: dialog.action,
        response_note: note || undefined,
        with_position: dialog.action === "answer" && withPosition && dialog.req.requestType === "network_location",
      });
      toast({
        title: dialog.action === "refuse" ? "Demande refusée" : "Demande traitée",
        description: res.observation
          ? `${dialog.req.incident.refNumber} — position réseau enregistrée (±${res.observation.accuracyRadiusM} m), visible par le propriétaire.`
          : `${dialog.req.incident.refNumber} — réponse enregistrée dans la chronologie du dossier.`,
      });
      setDialog(null); setNote(""); setTriPreview(null);
      load();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const previewTriangulation = async (req: BoPartnerRequest) => {
    setBusy(true);
    try {
      const res = await api.boTriangulate(req.incident.id, false);
      setTriPreview(res.triangulation);
      toast({
        title: "Aperçu de triangulation calculé",
        description: `±${res.triangulation.accuracy_radius_m} m · ${res.triangulation.anchors.length} ancres · résidu RMS ${res.triangulation.residual_rms_m} m (aucune donnée enregistrée).`,
      });
    } catch (e) {
      toast({ title: "Triangulation impossible", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const pending = (requests ?? []).filter((r) => r.status !== "answered" && r.status !== "refused");
  const done = (requests ?? []).filter((r) => r.status === "answered" || r.status === "refused");

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {stats.kpis.map((k) => <KpiCard key={k.key} label={k.label} value={k.value} hint={k.hint} tone={k.tone} />)}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_400px]">
        {/* File des demandes */}
        <section className="space-y-3">
          <SectionTitle icon={ClipboardList} title={`Demandes opérateurs (${pending.length} en cours)`} />
          <div className="space-y-3">
            {pending.map((r) => (
              <Card key={r.id} className={r.status === "transmitted" ? "border-amber-500/40" : ""}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-xs font-bold">{r.incident.refNumber}</code>
                        <StatusBadge status={r.incident.status} />
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                          {REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          r.status === "transmitted" ? "bg-sky-500/15 text-sky-600 dark:text-sky-400" : "bg-secondary text-muted-foreground"}`}>
                          {r.status === "transmitted" ? "transmise" : r.status === "inactive" ? "préparée (inactive)" : r.status}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {r.incident.owner.fullName} · {r.incident.device ? `${r.incident.device.brand} ${r.incident.device.model}` : "—"}
                        <span className="ml-2 font-mono text-[10px]">{r.incident.device?.deviceId}</span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed">{r.motive}</p>
                      {r.incident.identifiers.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <Fingerprint className="h-3 w-3" />
                          {r.incident.identifiers.map((i, idx) => (
                            <span key={idx} className="font-mono">
                              {i.type.toUpperCase()} <MaskedIdentifier value={i.value} />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-2">
                      {r.status === "inactive" || r.status === "draft" ? (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => transmit(r)}>
                          <Send className="h-3.5 w-3.5" /> Transmettre
                        </Button>
                      ) : (
                        <>
                          <Button size="sm" className="bg-primary hover:bg-primary/90" disabled={busy}
                            onClick={() => { setDialog({ req: r, action: "answer" }); setNote(""); setTriPreview(null); }}>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Traiter
                          </Button>
                          <Button size="sm" variant="ghost" disabled={busy}
                            onClick={() => { setDialog({ req: r, action: "refuse" }); setNote(""); setTriPreview(null); }}>
                            <XCircle className="h-3.5 w-3.5" /> Refuser
                          </Button>
                        </>
                      )}
                      {r.requestType === "network_location" && (
                        <Button size="sm" variant="outline" disabled={busy} onClick={() => previewTriangulation(r)}>
                          <Eye className="h-3.5 w-3.5" /> Aperçu triangulation
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {requests && pending.length === 0 && (
              <Card><CardContent className="px-4 py-10 text-center text-sm text-muted-foreground">
                Aucune demande en attente — la file opérateur est vide.
              </CardContent></Card>
            )}
            {!requests && <Skeleton className="h-40 rounded-xl" />}
          </div>

          {done.length > 0 && (
            <details className="rounded-xl border border-border bg-card">
              <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-muted-foreground">
                Demandes traitées ({done.length})
              </summary>
              <div className="space-y-2 border-t border-border p-4">
                {done.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/40 px-3 py-2 text-xs">
                    <span>
                      <code className="font-mono font-semibold">{r.incident.refNumber}</code>
                      <span className="ml-2 text-muted-foreground">{REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {r.responseNote && <span className="max-w-xs truncate text-[11px] text-muted-foreground" title={r.responseNote}>{r.responseNote}</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${r.status === "answered" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-red-500/15 text-red-600 dark:text-red-400"}`}>
                        {r.status === "answered" ? "traitée" : "refusée"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </section>

        {/* Panneau triangulation */}
        <section className="space-y-3">
          <SectionTitle icon={RadioTower} title="Triangulation réseau" />
          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                Aperçu du moteur de trilateration (Gauss-Newton sur distances RSSI) tel qu&apos;exécuté
                pour une localisation réseau autorisée. Aucune position n&apos;est enregistrée sans
                traitement explicite d&apos;une demande légale.
              </p>
              <TriangulationMiniMap tri={triPreview} />
              {triPreview && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-amber-500">±{triPreview.accuracy_radius_m} m</span>
                    <span className="text-muted-foreground">résidu RMS {triPreview.residual_rms_m} m</span>
                  </div>
                  <div className="max-h-32 space-y-1 overflow-y-auto pr-1">
                    {triPreview.anchors.map((a) => (
                      <div key={a.id} className="flex items-center justify-between rounded bg-secondary/40 px-2 py-1 text-[11px]">
                        <span className="flex items-center gap-1.5">
                          {a.kind === "cell" ? <RadioTower className="h-3 w-3 text-amber-500" /> : <Wifi className="h-3 w-3 text-sky-400" />}
                          {a.label}
                        </span>
                        <span className="font-mono text-muted-foreground">{a.rssi} dBm · {a.distance_m} m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Dialogue traitement / refus */}
      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          {dialog && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {dialog.action === "refuse" ? "Refuser la demande" : "Traiter la demande"}
                </DialogTitle>
                <DialogDescription>
                  {REQUEST_TYPE_LABELS[dialog.req.requestType] ?? dialog.req.requestType} — {dialog.req.incident.refNumber} · {dialog.req.incident.owner.fullName}.
                  La réponse est inscrite dans la chronologie visible par le propriétaire.
                </DialogDescription>
              </DialogHeader>
              {dialog.action === "answer" && dialog.req.requestType === "network_location" && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
                  <label className="flex cursor-pointer items-start gap-2.5 text-sm">
                    <input type="checkbox" checked={withPosition} onChange={(e) => setWithPosition(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#E53945]" />
                    <span>
                      <span className="font-medium">Joindre une position réseau triangulée</span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                        Exécute la trilateration du réseau (4 antennes + 4 points Wi-Fi) et enregistre une
                        observation « partenaire autorisé » visible sur la carte protégée du propriétaire.
                      </span>
                    </span>
                  </label>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="bo-note" className="text-xs">
                  {dialog.action === "refuse" ? "Motif du refus (requis)" : "Note de réponse (facultatif)"}
                </Label>
                <Textarea id="bo-note" value={note} onChange={(e) => setNote(e.target.value)}
                  className="min-h-20 text-sm"
                  placeholder={dialog.action === "refuse" ? "Ex. : dossier incomplet — référence de plainte manquante." : "Ex. : SIM suspendue à compter de…, référence interne…"} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
                <Button onClick={submit} disabled={busy || (dialog.action === "refuse" && !note.trim())}
                  className={dialog.action === "refuse" ? "" : "bg-primary hover:bg-primary/90"}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                  {dialog.action === "refuse" ? "Confirmer le refus" : "Enregistrer la réponse"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────── Espace POLICE ───────────────────────────

function PoliceSpace() {
  const { toast } = useToast();
  const { refreshKey } = useAlbatros();
  const [stats, setStats] = useState<BoStats | null>(null);
  const [incidents, setIncidents] = useState<BoIncident[] | null>(null);
  const [requests, setRequests] = useState<BoPartnerRequest[] | null>(null);
  const [dialog, setDialog] = useState<null | { req: BoPartnerRequest; action: "answer" | "refuse" }>(null);
  const [note, setNote] = useState("");
  const [reportDialog, setReportDialog] = useState<BoIncident | null>(null);
  const [reportRef, setReportRef] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.boStats("police").then((r) => setStats(r)).catch(() => setStats(null));
    api.boIncidents("police").then((r) => setIncidents(r.incidents)).catch(() => setIncidents([]));
    api.boPartnerRequests("police").then((r) => setRequests(r.requests)).catch(() => setRequests([]));
  };
  useEffect(load, [refreshKey]);

  const setStatus = async (incident: BoIncident, status: string) => {
    setBusy(true);
    try {
      await api.boUpdateIncident(incident.id, { status });
      toast({ title: "Dossier mis à jour", description: `${incident.refNumber} → ${status}. Chronologie et audit enrichis.` });
      load();
    } catch (e) {
      toast({ title: "Transition refusée", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const saveReport = async () => {
    if (!reportDialog || !reportRef.trim()) return;
    setBusy(true);
    try {
      await api.boUpdateIncident(reportDialog.id, { police_report_ref: reportRef.trim() });
      toast({ title: "Plainte enregistrée", description: `${reportDialog.refNumber} — référence ${reportRef.trim()} ajoutée au dossier.` });
      setReportDialog(null); setReportRef("");
      load();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const submitPartner = async () => {
    if (!dialog) return;
    setBusy(true);
    try {
      await api.boUpdatePartnerRequest(dialog.req.id, {
        action: dialog.action,
        response_note: note || undefined,
      });
      toast({ title: dialog.action === "refuse" ? "Demande refusée" : "Demande traitée", description: `${dialog.req.incident.refNumber} — réponse enregistrée.` });
      setDialog(null); setNote("");
      load();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const pendingRequests = (requests ?? []).filter((r) => r.status !== "answered" && r.status !== "refused");

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
          {stats.kpis.map((k) => <KpiCard key={k.key} label={k.label} value={k.value} hint={k.hint} tone={k.tone} />)}
        </div>
      )}

      {/* Demandes IMEI / autorités */}
      {pendingRequests.length > 0 && (
        <section className="space-y-3">
          <SectionTitle icon={FileBadge} title={`Demandes aux autorités (${pendingRequests.length})`} />
          <div className="space-y-3">
            {pendingRequests.map((r) => (
              <Card key={r.id} className="border-sky-500/30">
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="font-mono text-xs font-bold">{r.incident.refNumber}</code>
                        <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-400">
                          {REQUEST_TYPE_LABELS[r.requestType] ?? r.requestType}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {r.incident.owner.fullName} · {r.incident.device ? `${r.incident.device.brand} ${r.incident.device.model}` : "—"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed">{r.motive}</p>
                      {r.incident.identifiers.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <Fingerprint className="h-3 w-3" />
                          {r.incident.identifiers.map((i, idx) => (
                            <span key={idx} className="font-mono">{i.type.toUpperCase()} <MaskedIdentifier value={i.value} /></span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" className="bg-primary hover:bg-primary/90" disabled={busy}
                        onClick={() => { setDialog({ req: r, action: "answer" }); setNote(""); }}>
                        <CheckCircle2 className="h-3.5 w-3.5" /> Traiter
                      </Button>
                      <Button size="sm" variant="ghost" disabled={busy}
                        onClick={() => { setDialog({ req: r, action: "refuse" }); setNote(""); }}>
                        <XCircle className="h-3.5 w-3.5" /> Refuser
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Dossiers de vol */}
      <section className="space-y-3">
        <SectionTitle icon={Landmark} title="Dossiers de vol et plaintes" />
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Dossier</th>
                    <th className="px-4 py-3 font-medium">Propriétaire</th>
                    <th className="px-4 py-3 font-medium">Appareil</th>
                    <th className="px-4 py-3 font-medium">Lieu des faits</th>
                    <th className="px-4 py-3 font-medium">Plainte</th>
                    <th className="px-4 py-3 font-medium">Statut</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(incidents ?? []).map((i) => (
                    <tr key={i.id} className="border-b border-border/60 last:border-0 hover:bg-secondary/30">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-semibold">{i.refNumber}</span>
                        <div className="text-[11px] text-muted-foreground">
                          {i.type === "theft" ? "Vol" : "Perte"} · <FormatDateTime date={i.occurredAt} pattern="d MMM yyyy" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {i.owner.fullName}
                        <div className="text-[11px] text-muted-foreground">{i.owner.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {i.device ? `${i.device.brand} ${i.device.model}` : "—"}
                        <div className="font-mono text-[10px] text-muted-foreground">{i.device?.deviceId}</div>
                      </td>
                      <td className="max-w-44 truncate px-4 py-3 text-xs" title={i.locationText}>{i.locationText}</td>
                      <td className="px-4 py-3">
                        {i.policeReportRef ? (
                          <code className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">{i.policeReportRef}</code>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={busy}
                            onClick={() => { setReportDialog(i); setReportRef(""); }}>
                            Enregistrer plainte
                          </Button>
                        )}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={i.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1.5">
                          {i.status !== "transmitted" && i.status !== "closed" && (
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={busy}
                              onClick={() => setStatus(i, "transmitted")}>
                              <Send className="h-3 w-3" /> Transmis
                            </Button>
                          )}
                          {i.status === "transmitted" && (
                            <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={busy}
                              onClick={() => setStatus(i, "processing")}>
                              En enquête
                            </Button>
                          )}
                          {i.status !== "closed" && (
                            <Button size="sm" className="h-7 bg-primary text-[11px] hover:bg-primary/90" disabled={busy}
                              onClick={() => setStatus(i, "closed")}>
                              Clôturer
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {incidents && incidents.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">Aucun dossier de vol actif.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Dialogues */}
      <Dialog open={reportDialog !== null} onOpenChange={(o) => !o && setReportDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer une référence de plainte</DialogTitle>
            <DialogDescription>
              {reportDialog?.refNumber} — la référence du procès-verbal est ajoutée au dossier et
              reste visible par le propriétaire dans la chronologie.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="report-ref" className="text-xs">Référence (PV)</Label>
            <Input id="report-ref" value={reportRef} onChange={(e) => setReportRef(e.target.value)}
              placeholder="Ex. : PJ-PK-2026-0000" className="font-mono text-sm" />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setReportDialog(null)}>Annuler</Button>
            <Button onClick={saveReport} disabled={busy || !reportRef.trim()} className="bg-primary hover:bg-primary/90">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Enregistrer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-md">
          {dialog && (
            <>
              <DialogHeader>
                <DialogTitle>{dialog.action === "refuse" ? "Refuser la demande" : "Traiter la demande"}</DialogTitle>
                <DialogDescription>
                  {REQUEST_TYPE_LABELS[dialog.req.requestType] ?? dialog.req.requestType} — {dialog.req.incident.refNumber}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-1.5">
                <Label htmlFor="pol-note" className="text-xs">
                  {dialog.action === "refuse" ? "Motif du refus (requis)" : "Note de réponse"}
                </Label>
                <Textarea id="pol-note" value={note} onChange={(e) => setNote(e.target.value)} className="min-h-20 text-sm"
                  placeholder={dialog.action === "refuse" ? "Ex. : éléments insuffisants pour un blocage IMEI." : "Ex. : IMEI vérifié, blocage demandé au registre national."} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
                <Button onClick={submitPartner} disabled={busy || (dialog.action === "refuse" && !note.trim())}
                  className={dialog.action === "refuse" ? "" : "bg-primary hover:bg-primary/90"}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirmer
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────── Coquille back-office ───────────────────────────

export function BackOfficeApp() {
  const { user, boSpace, setBoSpace, setView, logout } = useAlbatros();
  const [spaces, setSpaces] = useState<BoSpaceInfo[] | null>(null);

  useEffect(() => {
    api.boSession()
      .then((r) => setSpaces(r.spaces))
      .catch(() => setSpaces([]));
  }, [user]);

  const accessible = useMemo(() => (spaces ?? []).filter((s) => s.accessible), [spaces]);

  // L'espace demandé n'est pas accessible → repli sur le premier espace autorisé
  useEffect(() => {
    if (accessible.length && !accessible.some((s) => s.key === boSpace)) {
      setBoSpace(accessible[0].key);
    }
  }, [accessible, boSpace, setBoSpace]);

  if (!spaces) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (accessible.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <LockKeyhole className="h-6 w-6 text-primary" />
        </span>
        <h1 className="text-xl font-bold">Accès restreint</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Votre compte ({user?.fullName}) n&apos;est rattaché à aucun espace back-office.
          Les espaces Système, GSM et Police nécessitent un rôle dédié attribué par
          l&apos;administrateur de la plateforme.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView("dashboard")}>Retour au portail citoyen</Button>
          <Button variant="ghost" onClick={() => logout()}><LogOut className="h-4 w-4" /> Déconnexion</Button>
        </div>
      </div>
    );
  }

  const meta = SPACE_META[boSpace] ?? SPACE_META.system;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* En-tête */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 md:px-6">
          <div className="flex items-center gap-2.5">
            <AlbatrosMark size={30} />
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">Back-office</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Albatros Protect</div>
            </div>
          </div>

          {/* Sélecteur d'espaces — trois espaces distincts */}
          <nav className="order-3 flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto" aria-label="Espaces back-office">
            {spaces.map((s) => {
              const sm = SPACE_META[s.key];
              const active = s.key === boSpace && s.accessible;
              return (
                <button
                  key={s.key}
                  disabled={!s.accessible}
                  onClick={() => setBoSpace(s.key)}
                  title={s.accessible ? s.description : "Aucun accès avec ce rôle"}
                  className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    active
                      ? "bg-primary text-white"
                      : s.accessible
                        ? "text-muted-foreground hover:bg-secondary hover:text-foreground"
                        : "cursor-not-allowed text-muted-foreground/40"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <sm.icon className="h-3.5 w-3.5" /> {sm.label}
                  {!s.accessible && <LockKeyhole className="h-3 w-3" />}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden text-right sm:block">
              <div className="text-xs font-semibold">{user?.fullName}</div>
              <div className="text-[10px] text-muted-foreground">
                {user?.role === "admin" ? "Administrateur système" : user?.role === "gsm_operator" ? "Agent opérateur" : user?.role === "police_officer" ? "Agent Police" : user?.role}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setView("dashboard")}>
              Portail citoyen <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => logout()} title="Déconnexion" aria-label="Déconnexion">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2.5 text-2xl font-bold">
              <meta.icon className={`h-6 w-6 ${meta.accent}`} />
              Espace {meta.label}
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {accessible.find((s) => s.key === boSpace)?.description ?? ""}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-[11px] text-muted-foreground">
            <Database className="h-3.5 w-3.5 text-emerald-500" />
            PostgreSQL Neon · données persistées
          </div>
        </div>
        {boSpace === "system" && <SystemSpace />}
        {boSpace === "gsm" && <GsmSpace />}
        {boSpace === "police" && <PoliceSpace />}
      </main>

      {/* Pied de page */}
      <footer className="border-t border-border bg-card/30 px-4 py-4 md:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5" />
            Back-office pilote — chaque action est inscrite au journal d&apos;audit
          </span>
          <span className="italic">Protéger. Localiser. Récupérer.</span>
        </div>
      </footer>
    </div>
  );
}
