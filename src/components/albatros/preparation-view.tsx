// Agent Albatros — assistant de préparation avant incident (F-020 … F-026)
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import { CATEGORY_ICON } from "./dashboard";
import { HonestyNote, EmptyState, FreshnessTag } from "./shared";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { readinessScore } from "@/lib/albatros";
import type { Device } from "./types";
import {
  ShieldCheck, Smartphone, MapPin, Bluetooth, BellRing, BatteryCharging,
  PackageCheck, Fingerprint, Loader2, CheckCircle2, AlertTriangle,
} from "lucide-react";

export function PreparationView() {
  const { refreshKey, refresh } = useAlbatros();
  const { toast } = useToast();
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.devices().then((d) => {
      if (!alive) return;
      setDevices(d.devices);
      setSelectedId((prev) => prev ?? d.devices[0]?.id ?? null);
    }).catch(() => alive && setDevices([]));
    return () => { alive = false; };
  }, [refreshKey]);

  const device = devices?.find((d) => d.id === selectedId) ?? null;

  const act = async (fn: () => Promise<unknown>, successTitle: string, successDesc?: string) => {
    setBusy(true);
    try {
      await fn();
      refresh();
      toast({ title: successTitle, description: successDesc });
    } catch (e) {
      toast({ title: "Action refusée", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const toggle = (key: string) => (v: boolean) =>
    act(() => api.updateDevice(device!.id, { [key]: v }), "Réglage mis à jour");

  const enroll = () =>
    act(
      () => api.enrollDevice(device!.id),
      "Agent enrôlé",
      "L'application/agent est associée à votre compte. La première position est transmise avec votre permission.",
    );

  if (!devices) {
    return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-72 rounded-xl" /></div>;
  }

  if (devices.length === 0) {
    return (
      <EmptyState
        icon={Smartphone}
        title="Ajoutez d'abord un appareil"
        hint="L'assistant de préparation guide l'activation des permissions utiles appareil par appareil."
      />
    );
  }

  const steps = device ? [
    {
      icon: Fingerprint,
      title: "Installer et enrôler l'application / l'agent",
      desc: "L'agent installé sur l'appareil se lie à votre compte par un défi à usage unique, approuvé depuis ce portail. Sans agent installé avant l'incident, un PC ne peut pas être localisé après un vol.",
      done: device.enrolled,
      action: !device.enrolled ? { label: "Enrôler l'agent (démo)", onClick: enroll } : null,
    },
    {
      icon: MapPin,
      title: "Activer la localisation directe",
      desc: "L'agent demande la position via les API documentées du système (GPS/GNSS, Wi-Fi, réseaux fusionnés par l'OS), avec votre permission. Le rythme s'adapte au mode et à la batterie (F-036).",
      done: device.locationEnabled,
      toggle: { key: "location_enabled", value: device.locationEnabled, disabled: !device.enrolled || busy },
    },
    {
      icon: Bluetooth,
      title: "Participer au réseau de détection Bluetooth",
      desc: "Votre appareil émet un identifiant temporaire rotatif (jamais votre nom, numéro ou IMEI) et peut détecter ceux des autres. Participation facultative, révocable à tout moment (F-024).",
      done: device.bleEnabled,
      toggle: { key: "ble_enabled", value: device.bleEnabled, disabled: !device.enrolled || busy },
    },
    {
      icon: BellRing,
      title: "Notifications sobres",
      desc: "Alertes et rappels d'action. Les notifications n'exposent jamais d'identifiants complets sur l'écran verrouillé (F-053).",
      done: device.notificationsEnabled,
      toggle: { key: "notifications_enabled", value: device.notificationsEnabled, disabled: !device.enrolled || busy },
    },
    {
      icon: BatteryCharging,
      title: "Profil batterie adapté",
      desc: "En mode normal, l'agent privilégie les événements système plutôt que les interrogations en boucle. En mode incident, le rythme peut augmenter dans les limites de l'OS.",
      done: device.batteryOptimized,
      toggle: { key: "battery_optimized", value: device.batteryOptimized, disabled: !device.enrolled || busy },
    },
    {
      icon: PackageCheck,
      title: "Déposer une preuve de propriété",
      desc: "Facture ou justificatif chiffré, conservé avec une durée contrôlée. Il facilite la vérification de propriété avant toute action sensible (F-013).",
      done: device.proofUploaded,
      action: !device.proofUploaded
        ? {
            label: "Déposer une preuve (démo)",
            onClick: () => {
              const name = window.prompt("Nom de la pièce (ex. Facture iStore Bénin) :");
              if (!name) return;
              act(
                () => api.uploadDocument({ name, type: "purchase_proof", device_id: device.id, size_kb: 410 }),
                "Preuve déposée",
                "Pièce chiffrée, accès journalisé, conservation limitée.",
              );
            },
          }
        : null,
    },
    {
      icon: Fingerprint,
      title: "Compléter les identifiants",
      desc: "IMEI (mobiles), numéro de série (PC/tablettes), référence de facture : renseignés par vous ou confirmés par l'agent quand le système le permet. La saisie seule d'un IMEI ne donne aucun contrôle (F-013).",
      done: device.identifiersComplete,
    },
  ] : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Préparation</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Préparez chaque appareil <strong className="text-foreground">avant</strong> l&apos;incident —
          c&apos;est ce qui détermine ce qui sera possible ensuite.
        </p>
      </div>

      {devices.length > 1 && (
        <Tabs value={selectedId ?? undefined} onValueChange={setSelectedId}>
          <TabsList className="h-auto flex-wrap justify-start bg-secondary/40">
            {devices.map((d) => {
              const Icon = CATEGORY_ICON[d.category] ?? Smartphone;
              return (
                <TabsTrigger key={d.id} value={d.id} className="gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {d.brand} {d.model}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      )}

      {device && (
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            {steps.map((s, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-5 ${s.done ? "border-emerald-900/40 bg-card" : "border-border bg-card"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.done ? "bg-emerald-950/40" : "bg-secondary"}`}>
                      <s.icon className={`h-5 w-5 ${s.done ? "text-emerald-400" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {s.title}
                        {s.done && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </div>
                      <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                  {"toggle" in s && s.toggle && (
                    <Switch
                      checked={s.toggle.value}
                      onCheckedChange={toggle(s.toggle.key)}
                      disabled={s.toggle.disabled}
                      aria-label={s.title}
                    />
                  )}
                </div>
                {s.action && (
                  <Button
                    onClick={s.action.onClick}
                    disabled={busy}
                    size="sm"
                    className="mt-4 bg-primary hover:bg-primary/90"
                  >
                    {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {s.action.label}
                  </Button>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">État de préparation</span>
                <span className="text-primary">{readinessScore(device)}%</span>
              </div>
              <Progress value={readinessScore(device)} className="mt-2 h-2 [&>div]:bg-primary" />
              <p className="mt-3 text-xs text-muted-foreground">
                <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                {device.enrolled
                  ? <>Agent actif · dernière transmission <FreshnessTag capturedAt={device.lastTransmissionAt!} /></>
                  : "Aucune application/agent enrôlé : la localisation ne pourra pas fonctionner."}
              </p>
            </div>

            <div className="rounded-xl border border-amber-900/50 bg-amber-950/10 p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4" /> Limites à connaître (F-022)
              </div>
              <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-muted-foreground">
                <li>• Une application ordinaire ne peut pas empêcher son extinction, sa désinstallation ou une réinitialisation usine.</li>
                <li>• Un appareil éteint ou sans batterie ne peut plus émettre le signal Bluetooth de l&apos;application.</li>
                <li>• Après une perte de contact, le service affiche « non joignable depuis… » — sans conclure à un vol ni à une extinction volontaire (F-025).</li>
                <li>• La détection communautaire dépend de la proximité et du nombre d&apos;appareils participants ; elle n&apos;est pas garantie partout (F-045).</li>
                <li>• Aucune photo clandestine n&apos;est jamais prise par la plateforme (F-026).</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      <HonestyNote variant="warn">
        La préparation améliore vos chances de récupération, elle ne les garantit pas. Chaque capacité
        affichée correspond à ce qui est <strong>réellement actif</strong> sur l&apos;appareil — aucune
        fonctionnalité déclarée ne repose sur un accès aux réseaux privés des fabricants (Find My / Find Hub).
      </HonestyNote>
    </div>
  );
}
