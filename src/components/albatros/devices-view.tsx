// Agent Albatros — inventaire des appareils (F-010 … F-015)
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import {
  MaskedIdentifier, EmptyState, HonestyNote, FreshnessTag, SourceBadge,
  StatusBadge, FormatDateTime,
} from "./shared";
import { CATEGORY_ICON } from "./dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { readinessScore } from "@/lib/albatros";
import type { Device, DeviceIdentifier, Consent, Observation, Incident, DocumentFile } from "./types";
import {
  Plus, Loader2, Smartphone, Trash2, Upload, PackageCheck, ShieldCheck,
  Bluetooth, MapPin, BellRing, BatteryCharging, FileText, X, Siren,
} from "lucide-react";

// ---------- Dialogue d'ajout ----------
function AddDeviceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const { refresh } = useAlbatros();
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [osName, setOsName] = useState("");
  const [osVersion, setOsVersion] = useState("");
  const [idents, setIdents] = useState<{ type: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!category || !brand.trim() || !model.trim()) {
      toast({ title: "Champs manquants", description: "Catégorie, marque et modèle sont obligatoires.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await api.createDevice({
        category, brand: brand.trim(), model: model.trim(),
        color: color.trim() || undefined,
        os_name: osName.trim() || undefined, os_version: osVersion.trim() || undefined,
        identifiers: idents.filter((i) => i.value.trim()),
      });
      toast({ title: "Appareil enregistré", description: "Ajoutez maintenant une preuve de propriété et complétez la préparation." });
      refresh();
      onOpenChange(false);
      setCategory(""); setBrand(""); setModel(""); setColor(""); setOsName(""); setOsVersion(""); setIdents([]);
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Ajouter un appareil</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Choisir…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="smartphone">Smartphone</SelectItem>
                <SelectItem value="tablet">Tablette</SelectItem>
                <SelectItem value="laptop">PC portable</SelectItem>
                <SelectItem value="desktop">PC de bureau</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Marque *</Label>
              <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Samsung" />
            </div>
            <div className="space-y-2">
              <Label>Modèle *</Label>
              <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Galaxy A54" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Couleur</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="Noir" />
            </div>
            <div className="space-y-2">
              <Label>OS</Label>
              <Input value={osName} onChange={(e) => setOsName(e.target.value)} placeholder="Android" />
            </div>
            <div className="space-y-2">
              <Label>Version</Label>
              <Input value={osVersion} onChange={(e) => setOsVersion(e.target.value)} placeholder="14" />
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Identifiants (recommandé)</Label>
              <Button
                variant="outline" size="sm"
                onClick={() => setIdents([...idents, { type: category === "laptop" || category === "desktop" ? "serial" : "imei", value: "" }])}
              >
                <Plus className="h-3.5 w-3.5" /> Ajouter
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              IMEI (mobiles), numéro de série (PC/tablettes) ou référence de facture. Ces valeurs sont
              chiffrées au repos, masquées dans l&apos;interface et jamais inscrites dans les journaux.
            </p>
            {idents.map((ident, idx) => (
              <div key={idx} className="flex gap-2">
                <Select
                  value={ident.type}
                  onValueChange={(v) => setIdents(idents.map((x, i) => i === idx ? { ...x, type: v } : x))}
                >
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="imei">IMEI</SelectItem>
                    <SelectItem value="serial">N° de série</SelectItem>
                    <SelectItem value="purchase_ref">Réf. facture</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={ident.value}
                  onChange={(e) => setIdents(idents.map((x, i) => i === idx ? { ...x, value: e.target.value } : x))}
                  placeholder={ident.type === "imei" ? "352094…" : ident.type === "serial" ? "DMPYD…" : "MTN-COT-…"}
                />
                <Button variant="ghost" size="icon" onClick={() => setIdents(idents.filter((_, i) => i !== idx))} aria-label="Retirer">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <Button onClick={submit} disabled={loading} className="w-full bg-primary hover:bg-primary/90">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer l&apos;appareil
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------- Fiche appareil ----------
function DeviceSheet({ deviceId, onClose }: { deviceId: string; onClose: () => void }) {
  const { toast } = useToast();
  const { refresh, openIncident, setView } = useAlbatros();
  const [data, setData] = useState<{
    device: Device; identifiers: DeviceIdentifier[]; consents: Consent[];
    observations: Observation[]; incidents: Incident[]; documents: DocumentFile[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try { setData(await api.deviceDetail(deviceId)); } catch { /* silencieux */ }
  };
  useEffect(() => { load();   }, [deviceId]);

  if (!data) {
    return (
      <Sheet open onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg">
          <div className="mt-8 space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-32 rounded-xl" /><Skeleton className="h-40 rounded-xl" /></div>
        </SheetContent>
      </Sheet>
    );
  }

  const { device } = data;
  const score = readinessScore(device);

  const toggle = async (key: string, value: boolean) => {
    setLoading(true);
    try {
      await api.updateDevice(device.id, { [key]: value });
      await load(); refresh();
    } catch (e) {
      toast({ title: "Action refusée", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const enroll = async () => {
    setLoading(true);
    try {
      const res = await api.enrollDevice(device.id);
      toast({
        title: "Agent enrôlé",
        description: res.notice,
      });
      await load(); refresh();
    } catch (e) {
      toast({ title: "Enrôlement impossible", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const uploadProof = async () => {
    const name = window.prompt("Nom de la pièce (ex. Facture Samsung Store Parakou) :");
    if (!name) return;
    setLoading(true);
    try {
      const res = await api.uploadDocument({ name, type: "purchase_proof", device_id: device.id, size_kb: 340 });
      toast({ title: "Pièce déposée", description: res.notice });
      await load(); refresh();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const remove = async () => {
    setLoading(true);
    try {
      await api.removeDevice(device.id);
      toast({ title: "Appareil retiré", description: "Les consentements associés ont été révoqués. L'historique reste auditable." });
      refresh(); onClose();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const CAPABILITIES = [
    { key: "location_enabled", field: "locationEnabled", label: "Localisation directe", desc: "L'agent transmet la position via les API du système, avec votre permission (consentement enregistré).", icon: MapPin, consent: true },
    { key: "ble_enabled", field: "bleEnabled", label: "Réseau de détection Bluetooth", desc: "Participation au réseau communautaire : émission d'un identifiant temporaire et détection anonyme.", icon: Bluetooth, consent: true },
    { key: "notifications_enabled", field: "notificationsEnabled", label: "Notifications", desc: "Alertes sobres : aucun identifiant complet sur l'écran verrouillé.", icon: BellRing, consent: false },
    { key: "battery_optimized", field: "batteryOptimized", label: "Profil batterie adapté", desc: "Rythme de collecte préservant l'autonomie en mode normal (F-036).", icon: BatteryCharging, consent: false },
  ];

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex flex-wrap items-center gap-3">
            {device.brand} {device.model}
            <Badge variant="outline" className="font-mono text-xs">{device.deviceId}</Badge>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6 pb-8">
          {/* État */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Score de préparation</span>
              <span className="text-primary">{score}%</span>
            </div>
            <Progress value={score} className="mt-2 h-2 [&>div]:bg-primary" />
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <Badge variant={device.enrolled ? "default" : "secondary"} className={device.enrolled ? "bg-emerald-600 hover:bg-emerald-600" : ""}>
                {device.enrolled ? "Agent enrôlé" : "Agent non installé"}
              </Badge>
              {device.proofUploaded && <Badge className="bg-primary/15 text-primary hover:bg-primary/25">Preuve de propriété</Badge>}
              {device.identifiersComplete && <Badge variant="secondary">Identifiants complets</Badge>}
              {device.openIncident && (
                <button onClick={() => openIncident(device.openIncident!.id)}>
                  <StatusBadge status={device.openIncident.status} />
                </button>
              )}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              {device.lastTransmissionAt
                ? <>Dernière transmission reçue <FreshnessTag capturedAt={device.lastTransmissionAt} /></>
                : "Aucune transmission reçue — l'agent n'a jamais communiqué."}
            </div>
            {!device.enrolled && (
              <Button onClick={enroll} disabled={loading} className="mt-4 w-full bg-primary hover:bg-primary/90">
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <ShieldCheck className="h-4 w-4" /> Enrôler l&apos;application (démo)
              </Button>
            )}
          </div>

          {/* Capacités (F-024) */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Capacités et consentements</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Chaque activation crée un consentement horodaté et révocable. Aucune collecte n&apos;a lieu sans votre accord explicite.
            </p>
            <div className="mt-4 space-y-4">
              {CAPABILITIES.map((c) => (
                <div key={c.key} className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <c.icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div>
                      <div className="text-sm font-medium leading-none">{c.label}</div>
                      <div className="mt-1.5 max-w-sm text-xs leading-relaxed text-muted-foreground">{c.desc}</div>
                    </div>
                  </div>
                  <Switch
                    checked={Boolean((device as unknown as Record<string, boolean>)[c.field])}
                    onCheckedChange={(v) => toggle(c.key, v)}
                    disabled={loading || !device.enrolled}
                    aria-label={c.label}
                  />
                </div>
              ))}
            </div>
            {!device.enrolled && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-600/80 dark:text-amber-300/80">
                Enrôlez d&apos;abord l&apos;application pour activer des capacités réelles.
              </p>
            )}
          </div>

          {/* Identifiants */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Identifiants (visibles par vous uniquement)</h3>
            <div className="mt-3 space-y-2">
              {data.identifiers.length === 0 && <p className="text-xs text-muted-foreground">Aucun identifiant enregistré.</p>}
              {data.identifiers.map((i) => (
                <div key={i.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {i.type === "imei" ? "IMEI" : i.type === "serial" ? "N° série" : i.type === "purchase_ref" ? "Réf. facture" : "Déclaré"}
                  </span>
                  <div className="flex items-center gap-2">
                    <MaskedIdentifier value={i.value} />
                    {i.verified && <Badge className="bg-emerald-600/15 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-600/25">vérifié</Badge>}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              La connaissance d&apos;un IMEI ne suffit jamais à prendre le contrôle d&apos;un dossier (F-013).
            </p>
          </div>

          {/* Justificatifs */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Preuves de propriété</h3>
              <Button variant="outline" size="sm" onClick={uploadProof} disabled={loading}>
                <Upload className="h-3.5 w-3.5" /> Déposer
              </Button>
            </div>
            <div className="mt-3 space-y-2">
              {data.documents.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucune pièce. Une preuve d&apos;achat facilite fortement les démarches ultérieures (F-012).
                </p>
              )}
              {data.documents.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg bg-secondary/30 px-3 py-2 text-sm">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="flex-1 truncate">{d.name}</span>
                  <span className="text-xs text-muted-foreground">{d.sizeKb} Ko · chiffré</span>
                </div>
              ))}
            </div>
          </div>

          {/* Observations */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Observations récentes</h3>
            {data.observations.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Aucune position enregistrée pour cet appareil.</p>
            ) : (
              <div className="mt-3 max-h-56 space-y-2 overflow-y-auto pr-1">
                {data.observations.map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-xs">
                    <SourceBadge source={o.source} />
                    <FreshnessTag capturedAt={o.capturedAt} accuracyM={o.accuracyRadiusM} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Historique incidents */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold">Historique d&apos;incidents</h3>
            {data.incidents.length === 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">Aucun incident déclaré pour cet appareil.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {data.incidents.map((i) => (
                  <button
                    key={i.id}
                    onClick={() => { onClose(); openIncident(i.id); }}
                    className="flex w-full items-center justify-between gap-2 rounded-lg bg-secondary/30 px-3 py-2 text-left text-sm hover:bg-secondary/50"
                  >
                    <span className="flex items-center gap-2"><Siren className="h-3.5 w-3.5 text-primary" /> {i.refNumber}</span>
                    <StatusBadge status={i.status} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Suppression */}
          <div className="rounded-xl border border-red-200 bg-[#FFF0F1] dark:border-red-900/40 dark:bg-red-950/10 p-5">
            <h3 className="text-sm font-semibold text-[#B91F2B] dark:text-red-300">Retirer l&apos;appareil</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Pour un appareil vendu, cédé ou retiré de votre inventaire. Les consentements sont révoqués immédiatement,
              l&apos;historique reste auditable (F-014).
            </p>
            <Button variant="destructive" className="mt-3" onClick={remove} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Retirer de mon inventaire
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------- Vue principale ----------
export function DevicesView() {
  const { refreshKey, setView } = useAlbatros();
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.devices()
      .then((d) => { if (alive) setDevices(d.devices); })
      .catch(() => { if (alive) setDevices([]); });
    return () => { alive = false; };
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Mes appareils</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventaire privé — identifiants chiffrés, visibles par vous et les rôles expressément habilités.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setView("preparation")}>
            <ShieldCheck className="h-4 w-4" /> Assistant de préparation
          </Button>
          <Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" /> Ajouter
          </Button>
        </div>
      </div>

      {!devices ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-36 rounded-xl" /><Skeleton className="h-36 rounded-xl" />
        </div>
      ) : devices.length === 0 ? (
        <EmptyState
          icon={Smartphone}
          title="Votre inventaire est vide"
          hint="Enregistrez vos appareils maintenant : identifiants, preuve d'achat et préparation se gèrent bien avant l'incident."
          action={<Button onClick={() => setAddOpen(true)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" /> Ajouter un appareil</Button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {devices.map((d) => {
            const Icon = CATEGORY_ICON[d.category] ?? Smartphone;
            const score = readinessScore(d);
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className="group rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary group-hover:bg-primary/10">
                      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <div>
                      <div className="font-medium leading-tight">{d.brand} {d.model}</div>
                      <div className="text-xs text-muted-foreground">{d.osName} {d.osVersion} · {d.color ?? "—"}</div>
                    </div>
                  </div>
                  {d.openIncident ? <StatusBadge status={d.openIncident.status} /> : d.enrolled
                    ? <span className="rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-900/60 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] text-emerald-600 dark:text-emerald-300">agent actif</span>
                    : <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[11px] text-muted-foreground">non enrôlé</span>}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <Progress value={score} className="h-1.5 flex-1 [&>div]:bg-primary" />
                  <span className="text-xs text-muted-foreground">{score}%</span>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.identifiersCount ?? 0} identifiant(s) · {d.proofUploaded ? "preuve déposée" : "sans preuve"}</span>
                  <span>{d.lastTransmissionAt ? <FreshnessTag capturedAt={d.lastTransmissionAt} /> : "jamais vu"}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <HonestyNote>
        <strong>Identifiants d&apos;appareil :</strong> l&apos;identifiant primaire du service est un ID opaque
        propre à Agent Albatros. L&apos;IMEI et le numéro de série restent des justificatifs déclaratifs —
        aucun OS ne garantit leur lecture par une application ordinaire, et la plateforme n&apos;effectue
        aucune localisation par IMEI de sa propre initiative (F-070).
      </HonestyNote>

      <AddDeviceDialog open={addOpen} onOpenChange={setAddOpen} />
      {selected && <DeviceSheet deviceId={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
