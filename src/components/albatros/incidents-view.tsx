// Agent Albatros — liste des incidents + parcours guidé de signalement (F-060 … F-066)
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import {
  EmptyState, StatusBadge, FreshnessTag, SourceBadge, FormatDateTime, StepUpDialog, HonestyNote,
} from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Device, Incident } from "./types";
import {
  Siren, Plus, Loader2, MapPin, Crosshair, ArrowRight, ArrowLeft, ShieldCheck,
  FileText, Phone, Scale, Lock, SearchX,
} from "lucide-react";

const STEPS = ["Type", "Appareil", "Quand & où", "Détails", "Confirmation"];

// ---------- Parcours guidé ----------
function IncidentWizard({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { toast } = useToast();
  const { refresh, openIncident } = useAlbatros();
  const [step, setStep] = useState(0);
  const [devices, setDevices] = useState<Device[]>([]);
  const [type, setType] = useState<"loss" | "theft">("theft");
  const [deviceId, setDeviceId] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [locationText, setLocationText] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [simPhone, setSimPhone] = useState("");
  const [policeRef, setPoliceRef] = useState("");
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      api.devices().then((d) => {
        const available = d.devices.filter((x) => !x.openIncident);
        setDevices(available);
        setDeviceId((prev) => prev || available[0]?.id || "");
      }).catch(() => setDevices([]));
      setOccurredAt(() => {
        const dt = new Date(Date.now() - 3600 * 1000);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
      });
    }
  }, [open]);

  const useMyPosition = () => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude); setLng(pos.coords.longitude);
        toast({ title: "Position actuelle enregistrée", description: "Elle sera jointe au dossier comme lieu approximatif." });
      },
      () => toast({ title: "Position indisponible", description: "Vous pourrez saisir le lieu en texte libre.", variant: "destructive" }),
      { timeout: 8000 },
    );
  };

  const canNext = [
    true,
    !!deviceId,
    occurredAt.length > 0 && locationText.trim().length > 0,
    true,
    true,
  ][step];

  const createWithTicket = async (ticket: string) => {
    setLoading(true);
    try {
      const res = await api.createIncident({
        device_id: deviceId,
        type,
        occurred_at: new Date(occurredAt).toISOString(),
        location_text: locationText.trim(),
        latitude: lat ?? undefined,
        longitude: lng ?? undefined,
        description: description.trim() || undefined,
        sim_phone: simPhone.trim() || undefined,
        police_report_ref: policeRef.trim() || undefined,
        step_up_ticket: ticket,
      });
      toast({ title: "Signalement confirmé", description: `Dossier ${res.incident.refNumber} créé.` });
      refresh();
      onOpenChange(false);
      reset();
      openIncident(res.incident.id);
    } catch (e) {
      toast({ title: "Création impossible", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const reset = () => {
    setStep(0); setType("theft"); setDeviceId(""); setLocationText("");
    setLat(null); setLng(null); setDescription(""); setSimPhone(""); setPoliceRef("");
  };

  const selectedDevice = devices.find((d) => d.id === deviceId);

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Siren className="h-5 w-5 text-primary" /> Signaler une perte ou un vol
            </DialogTitle>
            <DialogDescription>
              Parcours guidé — étape {step + 1} sur 5 : {STEPS[step]}
            </DialogDescription>
          </DialogHeader>

          {/* Fil d'étapes */}
          <div className="flex gap-1.5">
            {STEPS.map((s, i) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`} />
            ))}
          </div>

          <div className="min-h-[260px] pt-2">
            {step === 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Que s&apos;est-il passé ?</p>
                <div className="grid grid-cols-2 gap-4">
                  {([
                    { v: "theft", t: "Vol", d: "L'appareil vous a été soustrait, à l'arraché ou par effraction.", icon: Siren },
                    { v: "loss", t: "Perte", d: "Vous avez égaré l'appareil (taxi, marché, domicile…).", icon: SearchX },
                  ] as const).map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setType(o.v)}
                      className={`rounded-xl border p-5 text-left transition-colors ${
                        type === o.v ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <o.icon className={`h-5 w-5 ${type === o.v ? "text-primary" : "text-muted-foreground"}`} />
                      <div className="mt-2 font-medium">{o.t}</div>
                      <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{o.d}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Quel appareil est concerné ?</p>
                {devices.length === 0 ? (
                  <p className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-amber-200">
                    Aucun appareil disponible : tous ont déjà un dossier ouvert, ou votre inventaire est vide.
                    Clôturez le dossier existant ou ajoutez l&apos;appareil dans « Mes appareils ».
                  </p>
                ) : (
                  <div className="space-y-2">
                    {devices.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => setDeviceId(d.id)}
                        className={`flex w-full items-center justify-between rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          deviceId === d.id ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground/40"
                        }`}
                      >
                        <span>
                          <span className="font-medium">{d.brand} {d.model}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{d.deviceId}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{d.enrolled ? "agent actif" : "non enrôlé"}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="occurred">Date et heure approximatives *</Label>
                    <Input id="occurred" type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Lieu *</Label>
                    <Input
                      value={locationText} onChange={(e) => setLocationText(e.target.value)}
                      placeholder="Marché Dantokpa, Cotonou"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Position actuelle (facultatif — utile comme point de départ)
                  </Label>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={useMyPosition}>
                      <Crosshair className="h-3.5 w-3.5" /> Utiliser ma position
                    </Button>
                    {lat !== null && lng !== null && (
                      <span className="text-xs text-emerald-300">
                        <MapPin className="mr-1 inline h-3.5 w-3.5" />
                        {lat.toFixed(4)}, {lng.toFixed(4)} — approximative
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Circonstances (recommandé)</Label>
                  <Textarea
                    rows={4} value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Décrivez brièvement les circonstances de la perte ou du vol…"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Numéro de téléphone / SIM concerné</Label>
                    <Input value={simPhone} onChange={(e) => setSimPhone(e.target.value)} placeholder="+229 96 11 22 33" />
                  </div>
                  <div className="space-y-2">
                    <Label>Dépôt de plainte (référence)</Label>
                    <Input value={policeRef} onChange={(e) => setPoliceRef(e.target.value)} placeholder="PJ-COT-2026-XXXX (si déposée)" />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-secondary/30 p-4 text-sm">
                  <dl className="space-y-2">
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Type</dt><dd className="font-medium">{type === "theft" ? "Vol" : "Perte"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Appareil</dt><dd className="font-medium">{selectedDevice ? `${selectedDevice.brand} ${selectedDevice.model}` : "—"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Quand</dt><dd className="font-medium"><FormatDateTime date={new Date(occurredAt).toISOString()} /></dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Lieu</dt><dd className="font-medium">{locationText || "—"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">SIM</dt><dd className="font-medium">{simPhone || "non renseignée"}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-muted-foreground">Plainte</dt><dd className="font-medium">{policeRef || "non déposée"}</dd></div>
                  </dl>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  La confirmation exige une <strong>vérification renforcée</strong> (OTP) : un vol déclaré frauduleusement
                  sur un appareil ne vous appartenant pas serait un abus grave (F-003, §13.4). Votre dossier reçoit
                  un numéro de référence et une liste d&apos;actions immédiates.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="ghost" onClick={() => (step === 0 ? onOpenChange(false) : setStep(step - 1))}>
              <ArrowLeft className="h-4 w-4" /> {step === 0 ? "Annuler" : "Retour"}
            </Button>
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canNext} className="bg-primary hover:bg-primary/90">
                Continuer <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => setStepUpOpen(true)} disabled={loading} className="bg-primary hover:bg-primary/90">
                <ShieldCheck className="h-4 w-4" /> Confirmer le signalement
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <StepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        onVerified={createWithTicket}
        title="Confirmer le signalement"
      />
    </>
  );
}

// ---------- Liste ----------
export function IncidentsView() {
  const { refreshKey, openIncident, setView } = useAlbatros();
  const [incidents, setIncidents] = useState<Incident[] | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    api.incidents()
      .then((r) => { if (alive) setIncidents(r.incidents); })
      .catch(() => { if (alive) setIncidents([]); });
    return () => { alive = false; };
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Incidents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vos déclarations de perte ou de vol, avec chronologie complète et dossier exportable.
          </p>
        </div>
        <Button onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Nouveau signalement
        </Button>
      </div>

      {!incidents ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : incidents.length === 0 ? (
        <EmptyState
          icon={Siren}
          title="Aucun incident déclaré"
          hint="En cas de perte ou de vol, un signalement rapide crée un dossier horodaté, organise vos actions immédiates et prépare vos démarches."
          action={
            <Button onClick={() => setWizardOpen(true)} className="bg-primary hover:bg-primary/90">
              <Siren className="h-4 w-4" /> Signaler maintenant
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {incidents.map((i) => (
            <button
              key={i.id}
              onClick={() => openIncident(i.id)}
              className="group block w-full rounded-xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/40"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${i.status === "closed" ? "bg-secondary" : "bg-primary/15"}`}>
                    <Siren className={`h-5 w-5 ${i.status === "closed" ? "text-muted-foreground" : "text-primary"}`} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">{i.refNumber}</span>
                      <StatusBadge status={i.status} />
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {i.type === "theft" ? "Vol" : "Perte"} · {i.device?.brand} {i.device?.model} ·{" "}
                      <FormatDateTime date={i.occurredAt} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {i.lastObservation && (
                    <span className="hidden items-center gap-1.5 sm:flex">
                      <SourceBadge source={i.lastObservation.source} short />
                      <FreshnessTag capturedAt={i.lastObservation.capturedAt} accuracyM={i.lastObservation.accuracyRadiusM} />
                    </span>
                  )}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
              <p className="mt-3 line-clamp-1 text-sm text-muted-foreground">
                <MapPin className="mr-1 inline h-3.5 w-3.5" />{i.locationText}
                {i.policeReportRef && <> · <Scale className="ml-1 inline h-3.5 w-3.5" />Plainte {i.policeReportRef}</>}
              </p>
            </button>
          ))}
        </div>
      )}

      <HonestyNote>
        Un dossier signalement n&apos;est ni un procès-verbal ni une plainte : il organise vos déclarations,
        vos preuves et vos démarches. Tant qu&apos;aucune convention n&apos;est signée, aucun dossier n&apos;est
        transmis automatiquement à un opérateur ou à une autorité (F-076).
      </HonestyNote>

      <IncidentWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  );
}
