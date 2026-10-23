// Agent Albatros — page carte : sources distinctes, précision et fraîcheur affichées (§8, §19)
// Production : Google Maps Platform (Maps JS API + Geolocation API via backend).
// Pilote/démo : rendu Leaflet (plan sombre / satellite) — l'architecture adaptateur reste identique.
"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import "leaflet/dist/leaflet.css";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import { SourceBadge, HonestyNote, EmptyState, FreshnessTag } from "./shared";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { OBSERVATION_SOURCES, type ObservationSource } from "@/lib/albatros";
import type { Device, Incident, Observation } from "./types";
import {
  MapPin, Loader2, Layers, Play, Bluetooth, RadioTower, PowerOff, Smartphone, Map as MapIcon,
} from "lucide-react";

const SOURCE_KEYS = Object.keys(OBSERVATION_SOURCES) as ObservationSource[];

// ---------- Carte Leaflet (montage client, thème clair/sombre) ----------
const TILES = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

function AlbatrosMap({ observations, view, onReady }: {
  observations: Observation[];
  view: "plan" | "satellite";
  onReady?: (focus: (lat: number, lng: number, zoom?: number) => void) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const layerRef = useRef<import("leaflet").LayerGroup | null>(null);
  const tileRef = useRef<import("leaflet").TileLayer | null>(null);
  const { resolvedTheme } = useTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      const map = L.map(containerRef.current, {
        center: [9.3433, 2.6089], zoom: 12, zoomControl: true, attributionControl: true,
      });
      tileRef.current = L.tileLayer(
        TILES.dark,
        { attribution: "&copy; OpenStreetMap &copy; CARTO — démo", subdomains: "abcd", maxZoom: 20 },
      ).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
      onReady?.((lat, lng, zoom = 15) => map.flyTo([lat, lng], zoom, { duration: 0.8 }));
    })();
    return () => { cancelled = true; };
  }, []);

  // Fond de carte : plan (selon le thème) / satellite
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      if (!mapRef.current || !tileRef.current) return;
      mapRef.current.removeLayer(tileRef.current);
      tileRef.current =
        view === "satellite"
          ? L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
              { attribution: "Imagerie Esri — démo", maxZoom: 19 })
          : L.tileLayer(resolvedTheme === "dark" ? TILES.dark : TILES.light,
              { attribution: "&copy; OpenStreetMap &copy; CARTO — démo", subdomains: "abcd", maxZoom: 20 });
      tileRef.current.addTo(mapRef.current);
    })();
  }, [view, resolvedTheme]);

  // Marqueurs + cercles de précision, jamais fusionnés (§8.2)
  useEffect(() => {
    (async () => {
      const L = (await import("leaflet")).default;
      const layer = layerRef.current;
      if (!L || !layer) return;
      layer.clearLayers();
      for (const o of observations) {
        const color = OBSERVATION_SOURCES[o.source as ObservationSource]?.color ?? "#a1a1aa";
        if (o.accuracyRadiusM) {
          L.circle([o.latitude, o.longitude], {
            radius: o.accuracyRadiusM, color, weight: 1, opacity: 0.55, fillColor: color, fillOpacity: 0.08,
          }).addTo(layer);
        }
        const marker = L.circleMarker([o.latitude, o.longitude], {
          radius: 6, color, weight: 2, fillColor: color, fillOpacity: 0.95,
        }).addTo(layer);
        marker.bindPopup(
          `<div style="font-size:12px;line-height:1.5;min-width:180px">
            <strong style="color:${color}">${OBSERVATION_SOURCES[o.source as ObservationSource]?.label ?? o.source}</strong><br/>
            Collecté : ${new Date(o.capturedAt).toLocaleString("fr-FR")}<br/>
            Précision : ${o.accuracyRadiusM ? "±" + Math.round(o.accuracyRadiusM) + " m" : "inconnue"}<br/>
            <span style="color:#a1a1aa">${o.note ?? ""}</span>
          </div>`,
        );
      }
      if (observations.length) {
        const last = observations[0];
        mapRef.current?.flyTo([last.latitude, last.longitude], 13, { duration: 0.6 });
      }
    })();
  }, [observations, ready]);

  return (
    <div className="relative h-[380px] overflow-hidden rounded-xl border border-border md:h-[540px]">
      <div ref={containerRef} className="h-full w-full" />
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}

// ---------- Vue principale ----------
export function MapView() {
  const { toast } = useToast();
  const { refreshKey, refresh, user } = useAlbatros();
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [deviceId, setDeviceId] = useState("");
  const [incidentId, setIncidentId] = useState<string>("none");
  const [sources, setSources] = useState<string[]>([...SOURCE_KEYS]);
  const [hours, setHours] = useState("72");
  const [observations, setObservations] = useState<Observation[]>([]);
  const [view, setView] = useState<"plan" | "satellite">("plan");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const focusRef = useRef<((lat: number, lng: number, z?: number) => void) | null>(null);

  useEffect(() => {
    Promise.all([api.devices(), api.incidents()])
      .then(([d, i]) => {
        setDevices(d.devices);
        setIncidents(i.incidents);
        setDeviceId((prev) => prev || d.devices[0]?.id || "");
        const open = i.incidents.find((x) => !["closed", "draft"].includes(x.status));
        if (open) setIncidentId(open.id);
      })
      .catch(() => setDevices([]));
  }, [refreshKey]);

  const device = devices?.find((d) => d.id === deviceId) ?? null;

  const load = async () => {
    if (!deviceId) return;
    setLoading(true);
    try {
      let obs: Observation[] = [];
      if (incidentId !== "none") {
        const qs = new URLSearchParams();
        sources.forEach((s) => qs.append("source", s));
        qs.set("since_hours", hours === "all" ? "" : hours);
        const res = await api.incidentMap(incidentId, `?${qs.toString()}`);
        obs = res.observations;
      } else {
        const res = await api.deviceDetail(deviceId);
        obs = res.observations;
      }
      const cutoff = hours === "all" ? 0 : Date.now() - Number(hours) * 3600 * 1000;
      setObservations(
        obs.filter((o) => sources.includes(o.source) && new Date(o.capturedAt).getTime() >= cutoff),
      );
    } catch {
      setObservations([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load();   }, [deviceId, incidentId, refreshKey]);

  const toggleSource = (s: string) =>
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const simulate = async (action: "native_position" | "ble_detection" | "unreachable") => {
    if (!device) return;
    setBusy(true);
    try {
      const res = await api.demoSimulate(device.id, action);
      if (res.unreachable) {
        toast({ title: "Transmissions interrompues (démo)", description: res.message });
      } else if (res.observation) {
        toast({
          title: "Observation simulée",
          description: `${OBSERVATION_SOURCES[res.observation.source as ObservationSource]?.label} — ${res.observation.note ?? ""}`,
        });
        focusRef.current?.(res.observation.latitude, res.observation.longitude, 15);
      }
      await load(); refresh();
    } catch (e) {
      toast({ title: "Simulation refusée", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const radioEstimate = async () => {
    if (!device) return;
    setBusy(true);
    try {
      const res = await api.radioEstimate(device.id, 4 + Math.floor(Math.random() * 4), 2);
      toast({
        title: "Estimation Wi-Fi/cellulaire calculée",
        description: `Rayon ±${res.observation.accuracyRadiusM} m · quota restant aujourd'hui : ${res.quota_remaining_today}. Entrées brutes purgées.`,
      });
      focusRef.current?.(res.observation.latitude, res.observation.longitude, 15);
      await load(); refresh();
    } catch (e) {
      toast({
        title: "Estimation impossible",
        description: e instanceof ApiError ? e.message : "Erreur",
        variant: "destructive",
      });
    } finally { setBusy(false); }
  };

  if (!devices) {
    return <div className="space-y-4"><Skeleton className="h-10 w-72" /><Skeleton className="h-[540px] rounded-xl" /></div>;
  }
  if (devices.length === 0) {
    return (
      <EmptyState
        icon={MapIcon}
        title="Aucun appareil à cartographier"
        hint="Ajoutez un appareil et enrôlez son application pour voir les positions réellement transmises."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Carte de localisation</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Accès renforcé ({user?.fullName ? "vérifié" : ""}) — chaque source est affichée séparément, jamais fusionnée.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "plan" ? "default" : "outline"} size="sm" onClick={() => setView("plan")} className={view === "plan" ? "bg-primary hover:bg-primary/90" : ""}>
            <Layers className="h-3.5 w-3.5" /> Plan
          </Button>
          <Button variant={view === "satellite" ? "default" : "outline"} size="sm" onClick={() => setView("satellite")} className={view === "satellite" ? "bg-primary hover:bg-primary/90" : ""}>
            <Layers className="h-3.5 w-3.5" /> Satellite
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Carte */}
        <div className="relative">
          <AlbatrosMap
            observations={observations}
            view={view}
            onReady={(focus) => { focusRef.current = focus; }}
          />
          {loading && (
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-border bg-background/90 px-3 py-1.5 text-xs">
              <Loader2 className="h-3 w-3 animate-spin text-primary" /> Actualisation…
            </div>
          )}
          {observations.length > 0 && (
            <div className="absolute bottom-3 left-3 rounded-lg border border-border bg-background/90 px-3 py-1.5 text-xs text-muted-foreground">
              Dernière observation : <FreshnessTag capturedAt={observations[0].capturedAt} accuracyM={observations[0].accuracyRadiusM} />
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-4">
            <Label className="text-xs text-muted-foreground">Appareil</Label>
            <Select value={deviceId} onValueChange={(v) => { setDeviceId(v); setIncidentId("none"); }}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {devices.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.brand} {d.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="mt-4 text-xs text-muted-foreground">Dossier d&apos;incident (facultatif)</Label>
            <Select value={incidentId} onValueChange={setIncidentId}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun dossier (toutes les observations)</SelectItem>
                {incidents.map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.refNumber} — {i.type === "theft" ? "vol" : "perte"}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="mt-4 text-xs text-muted-foreground">Période</Label>
            <Select value={hours} onValueChange={(v) => { setHours(v); setTimeout(load, 0); }}>
              <SelectTrigger className="mt-1 w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 dernières heures</SelectItem>
                <SelectItem value="72">3 derniers jours</SelectItem>
                <SelectItem value="168">7 derniers jours</SelectItem>
                <SelectItem value="all">Tout l&apos;historique conservé</SelectItem>
              </SelectContent>
            </Select>

            <Label className="mt-4 text-xs text-muted-foreground">Sources</Label>
            <div className="mt-2 space-y-2">
              {SOURCE_KEYS.map((s) => (
                <label key={s} className="flex cursor-pointer items-start gap-2.5 text-xs leading-tight">
                  <Checkbox checked={sources.includes(s)} onCheckedChange={() => toggleSource(s)} className="mt-0.5" />
                  <SourceBadge source={s} />
                </label>
              ))}
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Appliquer les filtres
            </Button>
          </div>

          {/* Simulateur de démonstration */}
          {device && (
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                <Play className="h-3.5 w-3.5" /> Simulateur pilote
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Sans application mobile installée, générez des observations fictives pour voir les flux réels :
                position native, détection BLE, estimation Wi-Fi/cellulaire (adaptateur Google Geolocation côté
                serveur, simulation au pilote), perte de contact.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => simulate("native_position")} disabled={busy || !device.enrolled}>
                  <Smartphone className="h-3.5 w-3.5" /> Position
                </Button>
                <Button size="sm" variant="outline" onClick={() => simulate("ble_detection")} disabled={busy || !device.bleEnabled}>
                  <Bluetooth className="h-3.5 w-3.5" /> Détection
                </Button>
                <Button size="sm" variant="outline" onClick={radioEstimate} disabled={busy || !device.enrolled}>
                  <RadioTower className="h-3.5 w-3.5" /> Estimation
                </Button>
                <Button size="sm" variant="outline" onClick={() => simulate("unreachable")} disabled={busy}>
                  <PowerOff className="h-3.5 w-3.5" /> Non joignable
                </Button>
              </div>
              {!device.enrolled && (
                <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-600/80 dark:text-amber-300/80">
                  Enrôlez l&apos;agent de cet appareil (Préparation) pour activer les simulations de position.
                </p>
              )}
            </div>
          )}

          {/* Liste des observations */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">Observations ({observations.length})</span>
              <span className="text-[10px] text-muted-foreground">les plus récentes d&apos;abord</span>
            </div>
            <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
              {observations.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucune observation pour ces filtres. Aucune position n&apos;est extrapolée : c&apos;est
                  une absence d&apos;information, pas un état de l&apos;appareil (F-025).
                </p>
              )}
              {observations.map((o) => (
                <button
                  key={o.id}
                  onClick={() => focusRef.current?.(o.latitude, o.longitude, 16)}
                  className="w-full rounded-lg bg-secondary/40 px-3 py-2 text-left hover:bg-secondary/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <SourceBadge source={o.source} short />
                    <FreshnessTag capturedAt={o.capturedAt} accuracyM={o.accuracyRadiusM} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Légende */}
      <div className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        {SOURCE_KEYS.map((s) => {
          const cfg = OBSERVATION_SOURCES[s];
          return (
            <div key={s} className="flex items-start gap-3">
              <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: cfg.color }} />
              <div>
                <div className="text-sm font-medium">{cfg.label}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{cfg.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      <HonestyNote>
        <strong>Affichage honnête :</strong> la position d&apos;une détection Bluetooth est celle du téléphone
        détecteur — un indice de proximité, pas un GPS de l&apos;appareil. Une estimation Wi-Fi/cellulaire expose son
        rayon d&apos;incertitude. Une position ancienne est estompée par son horodatage. Les sources discordantes ne
        sont jamais fusionnées en un point unique (§8.2, §19.5). En production, le fond de carte utilise
        Google Maps Platform (Maps JavaScript API) avec clé restreinte au domaine ; l&apos;imagerie n&apos;améliore
        jamais la précision des coordonnées.
      </HonestyNote>
    </div>
  );
}
