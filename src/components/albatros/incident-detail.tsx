// Agent Albatros — dossier d'incident : chronologie, actions, partenaires, export (F-061 … F-066)
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import {
  StatusBadge, SourceBadge, FreshnessTag, FormatDateTime, HonestyNote, MaskedIdentifier,
} from "./shared";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { IncidentDetail } from "./types";
import {
  Siren, MapPin, Download, Printer, Scale, Phone, Lock, FileText, ShieldCheck,
  ExternalLink, CircleCheck, Handshake, X, Loader2, CheckCircle2,
} from "lucide-react";

const OPERATORS = ["MTN Bénin", "Moov Africa Bénin", "Celtiis (SBIN)"];
const AUTHORITIES = ["Police (Cotonou)", "Gendarmerie", "Justice"];

const IMMEDIATE_ACTIONS = [
  { icon: Lock, t: "Sécuriser vos comptes en ligne", d: "Changez les mots de passe de vos emails, réseaux sociaux et applications bancaires depuis un appareil de confiance. Déconnectez les sessions distantes." },
  { icon: Phone, t: "Contacter votre opérateur pour suspendre la SIM", d: "Une SIM suspendue rapidement empêche les appels et SMS frauduleux à vos frais. Au pilote : aucune transmission automatique — utilisez le dossier exportable et le canal officiel de l'opérateur." },
  { icon: FileText, t: "Retrouver l'IMEI de l'appareil", d: "Facture, emballage d'origine, ou espace fabricant (find my device). L'IMEI identifie l'équipement : il ne localise rien et ne bloque rien seul (F-070)." },
  { icon: ShieldCheck, t: "Ouvrir les outils officiels du fabricant (externe)", d: "Google Find Hub (Android) ou Apple iCloud Find My (iOS) — verrouillage/effacement se font dans ces services, à votre initiative. Agent Albatros n'y a aucun accès intégré." },
  { icon: Scale, t: "Déposer plainte en cas de vol", d: "Auprès des autorités compétentes avec le récapitulatif exportable. Conservez la référence dans le dossier : elle facilite les suites." },
  { icon: MapPin, t: "Ne jamais vous rendre seul vers une position", d: "L'interface ne vous y invitera jamais : en cas de danger, alertez les autorités (critère d'acceptation n°12 du pilote)." },
];

export function IncidentDetailView({ incidentId }: { incidentId: string }) {
  const { toast } = useToast();
  const { refresh, setView } = useAlbatros();
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [doneActions, setDoneActions] = useState<Set<number>>(new Set());
  const [partnerType, setPartnerType] = useState("operator");
  const [partnerName, setPartnerName] = useState(OPERATORS[0]);
  const [requestType, setRequestType] = useState("sim_suspension");
  const [busy, setBusy] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [closeDialog, setCloseDialog] = useState<null | "close" | "cancel" | "dispute">(null);
  const [closeReason, setCloseReason] = useState("");

  const load = () => api.incidentDetail(incidentId).then(setDetail).catch(() => setDetail(null));
  useEffect(() => { load();   }, [incidentId]);

  if (!detail) {
    return <div className="space-y-4"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-64 rounded-xl" /></div>;
  }

  const { incident, events, observations, partnerRequests, documents, identifiers } = detail;
  const isOpen = !["closed", "disputed"].includes(incident.status);

  const doClose = async () => {
    if (!closeDialog) return;
    setBusy(true);
    try {
      await api.updateIncident(incident.id, {
        action: closeDialog,
        close_reason: closeDialog === "close" ? closeReason || undefined : undefined,
      });
      toast({ title: "Dossier mis à jour", description: "La clôture est enregistrée dans la chronologie." });
      setCloseDialog(null); setCloseReason("");
      await load(); refresh();
    } catch (e) {
      toast({ title: "Action impossible", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const preparePartnerRequest = async () => {
    setBusy(true);
    try {
      const res = await api.partnerRequest(incident.id, {
        partner_type: partnerType, partner_name: partnerName, request_type: requestType,
      });
      toast({
        title: "Demande préparée (inactive)",
        description: res.message,
      });
      await load(); refresh();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const exportJson = async () => {
    const dossier = await api.exportIncident(incident.id);
    const blob = new Blob([JSON.stringify(dossier, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dossier-${incident.refNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Dossier exporté", description: "JSON horodaté avec la provenance de chaque élément (F-064)." });
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <button onClick={() => setView("incidents")} className="mb-4 text-xs text-muted-foreground hover:text-foreground">
          ← Tous les incidents
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-2xl font-bold">{incident.refNumber}</h1>
              <StatusBadge status={incident.status} />
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span>{incident.type === "theft" ? "Vol" : "Perte"} — {incident.device?.brand} {incident.device?.model}</span>
              <span><FormatDateTime date={incident.occurredAt} /></span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{incident.locationText}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportJson}><Download className="h-4 w-4" /> JSON</Button>
            <Button variant="outline" onClick={() => setPrintMode(true)}><Printer className="h-4 w-4" /> Récapitulatif</Button>
            {isOpen && (
              <>
                {incident.type === "loss" && (
                  <Button variant="outline" onClick={() => setCloseDialog("cancel")}><CheckCircle2 className="h-4 w-4" /> J&apos;ai retrouvé l&apos;appareil</Button>
                )}
                <Button variant="destructive" onClick={() => setCloseDialog("close")}>Clôturer</Button>
                <Button variant="ghost" onClick={() => setCloseDialog("dispute")}>Contester</Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Identifiants et références */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Appareil concerné</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">ID de service</span><code className="font-mono text-xs">{incident.device?.deviceId}</code></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Marque / modèle</span><span>{incident.device?.brand} {incident.device?.model}</span></div>
            {identifiers.slice(0, 3).map((i) => (
              <div key={i.id} className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">{i.type === "imei" ? "IMEI" : i.type === "serial" ? "N° série" : "Réf."}</span>
                <MaskedIdentifier value={i.value} />
              </div>
            ))}
            {incident.simPhone && (
              <div className="flex justify-between"><span className="text-muted-foreground">SIM déclarée</span><span>{incident.simPhone}</span></div>
            )}
            {incident.policeReportRef && (
              <div className="flex justify-between"><span className="text-muted-foreground">Référence plainte</span><code className="font-mono text-xs">{incident.policeReportRef}</code></div>
            )}
          </div>
        </div>

        {/* Actions immédiates (F-063) */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold">Actions recommandées</h3>
          <p className="mt-1 text-xs text-muted-foreground">Cochez au fur et à mesure — vos cochages restent locaux à cette session.</p>
          <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1">
            {IMMEDIATE_ACTIONS.map((a, idx) => (
              <button
                key={a.t}
                onClick={() =>
                  setDoneActions((s) => {
                    const next = new Set(s);
                    if (next.has(idx)) next.delete(idx);
                    else next.add(idx);
                    return next;
                  })
                }
                className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-secondary/40"
              >
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    doneActions.has(idx) ? "border-primary bg-primary" : "border-muted-foreground/40"
                  }`}
                >
                  {doneActions.has(idx) && <CircleCheck className="h-3 w-3 text-white" />}
                </span>
                <span>
                  <span className={`text-sm font-medium ${doneActions.has(idx) ? "text-muted-foreground line-through" : ""}`}>{a.t}</span>
                  <span className="block text-xs leading-relaxed text-muted-foreground">{a.d}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chronologie */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Chronologie du dossier</h3>
        <div className="mt-4 space-y-0">
          {events.map((e, i) => (
            <div key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
              {i < events.length - 1 && <span className="absolute left-[9px] top-5 h-full w-px bg-border" />}
              <span className={`mt-1 h-[18px] w-[18px] shrink-0 rounded-full border-2 ${
                e.type === "closure" ? "border-emerald-500 bg-emerald-950"
                : e.type === "status_change" ? "border-primary bg-primary/20"
                : e.type === "partner" ? "border-amber-500 bg-amber-950"
                : "border-border bg-secondary"
              }`} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{e.label}</span>
                  <span className="text-xs text-muted-foreground"><FormatDateTime date={e.createdAt} pattern="d MMM · HH:mm" /></span>
                </div>
                {e.detail && <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{e.detail}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Observations */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Observations ({observations.length})</h3>
          <Button variant="outline" size="sm" onClick={() => setView("map")}>
            <MapPin className="h-3.5 w-3.5" /> Voir sur la carte
          </Button>
        </div>
        {observations.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune observation pour l&apos;instant. Aucune position n&apos;est affichée tant qu&apos;aucune source
            réelle n&apos;en fournit (§4.1).
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {observations.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/30 px-3 py-2">
                <SourceBadge source={o.source} />
                <span className="text-xs text-muted-foreground"><FormatDateTime date={o.capturedAt} /></span>
                <FreshnessTag capturedAt={o.capturedAt} accuracyM={o.accuracyRadiusM} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Partenaires (F-070 … F-076) */}
      <div className="rounded-xl border border-amber-900/40 bg-amber-950/10 p-5">
        <div className="flex items-center gap-2">
          <Handshake className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold">Demandes opérateur / autorités</h3>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Aucun parcours partenaire n&apos;est actif sans convention signée. Vous pouvez <strong>préparer</strong> une
          demande pour l&apos;avoir sous la main, mais la plateforme ne transmet rien au réseau : seul le dossier
          exportable et les instructions officielles s&apos;appliquent (F-076, PARTNER_FLOW_NOT_ENABLED).
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Select value={partnerType} onValueChange={(v) => { setPartnerType(v); setPartnerName(v === "operator" ? OPERATORS[0] : AUTHORITIES[0]); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="operator">Opérateur</SelectItem>
              <SelectItem value="authority">Autorité</SelectItem>
            </SelectContent>
          </Select>
          <Select value={partnerName} onValueChange={setPartnerName}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(partnerType === "operator" ? OPERATORS : AUTHORITIES).map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={requestType} onValueChange={setRequestType}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="sim_suspension">Suspension SIM</SelectItem>
              <SelectItem value="imei_block">Vérification / blocage IMEI</SelectItem>
              <SelectItem value="network_location">Localisation réseau (légale)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={preparePartnerRequest} disabled={busy || !isOpen}>
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Préparer la demande
          </Button>
        </div>

        {partnerRequests.length > 0 && (
          <div className="mt-4 space-y-2">
            {partnerRequests.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <span>
                  <strong>{p.partnerName}</strong> · {p.requestType === "sim_suspension" ? "Suspension SIM" : p.requestType === "imei_block" ? "Blocage IMEI" : "Localisation réseau"}
                </span>
                <span className="rounded-full border border-amber-900/50 bg-amber-950/30 px-2 py-0.5 text-[11px] text-amber-300">
                  {p.status === "inactive" ? "inactive — aucune convention" : p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outils externes (F-035) */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Outils officiels du fabricant (services externes)</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Ces outils restent entièrement externes à Agent Albatros : vous agissez directement chez le fabricant,
          la plateforme n&apos;en récupère aucune position (F-035).
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="https://www.google.com/android/find" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm hover:border-primary/40"
          >
            Google Find Hub (Android) <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
          <a
            href="https://www.icloud.com/find" target="_blank" rel="noreferrer"
            className="flex items-center gap-2 rounded-lg border border-border bg-secondary/40 px-4 py-2 text-sm hover:border-primary/40"
          >
            Apple iCloud — Localiser <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {incident.closedAt && (
        <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-5 text-sm">
          <strong className="text-emerald-300">Dossier clôturé</strong> le <FormatDateTime date={incident.closedAt} />.
          {incident.closeReason && <span className="text-muted-foreground"> {incident.closeReason}</span>}
        </div>
      )}

      {/* Dialogues de clôture */}
      <Dialog open={closeDialog !== null} onOpenChange={(o) => !o && setCloseDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {closeDialog === "cancel" ? "Appareil retrouvé" : closeDialog === "close" ? "Clôturer le dossier" : "Contester le dossier"}
            </DialogTitle>
            <DialogDescription>
              {closeDialog === "cancel"
                ? "Le signalement de perte sera annulé et l'appareil redeviendra utilisable normalement. L'historique reste auditable."
                : closeDialog === "close"
                ? "La clôture met fin au suivi. Les éléments requis par une obligation légale ou un litige éventuel sont conservés (F-066)."
                : "Le dossier passera au statut « contesté » pour revue par le support."}
            </DialogDescription>
          </DialogHeader>
          {closeDialog === "close" && (
            <textarea
              className="min-h-20 w-full rounded-lg border border-input bg-secondary/40 p-3 text-sm"
              placeholder="Motif de clôture (facultatif)…"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCloseDialog(null)}>Annuler</Button>
            <Button onClick={doClose} disabled={busy} className={closeDialog === "dispute" ? "" : "bg-primary hover:bg-primary/90"}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmer
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Récapitulatif imprimable (F-064) */}
      {printMode && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white text-black">
          <div className="mx-auto max-w-2xl px-8 py-10">
            <div className="flex items-center justify-between border-b-2 border-red-600 pb-4">
              <div>
                <h1 className="text-2xl font-bold text-red-700">AGENT ALBATROS</h1>
                <p className="text-sm">Récapitulatif de dossier — pilote Cotonou</p>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button onClick={() => window.print()} className="bg-red-600 hover:bg-red-700"><Printer className="h-4 w-4" /> Imprimer / PDF</Button>
                <Button variant="outline" onClick={() => setPrintMode(false)}><X className="h-4 w-4" /></Button>
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
              <div><dt className="text-gray-500">Référence</dt><dd className="font-mono font-semibold">{incident.refNumber}</dd></div>
              <div><dt className="text-gray-500">Type</dt><dd className="font-semibold">{incident.type === "theft" ? "Vol" : "Perte"}</dd></div>
              <div><dt className="text-gray-500">Date des faits</dt><dd><FormatDateTime date={incident.occurredAt} /></dd></div>
              <div><dt className="text-gray-500">Déclaré le</dt><dd><FormatDateTime date={incident.declaredAt} /></dd></div>
              <div><dt className="text-gray-500">Lieu déclaré</dt><dd>{incident.locationText}</dd></div>
              <div><dt className="text-gray-500">Statut</dt><dd className="font-semibold">{incident.status}</dd></div>
              <div><dt className="text-gray-500">Appareil</dt><dd>{incident.device?.brand} {incident.device?.model} ({incident.device?.deviceId})</dd></div>
              <div><dt className="text-gray-500">Plainte</dt><dd>{incident.policeReportRef ?? "non déposée"}</dd></div>
            </dl>
            {incident.description && (
              <div className="mt-4">
                <p className="text-sm font-semibold">Circonstances déclarées</p>
                <p className="mt-1 text-sm leading-relaxed">{incident.description}</p>
              </div>
            )}
            <div className="mt-6">
              <p className="text-sm font-semibold">Identifiants (masqués)</p>
              <ul className="mt-1 space-y-1 text-sm">
                {identifiers.map((i) => (
                  <li key={i.id}>{i.type.toUpperCase()} : {i.value.slice(0, 3)}•••••{i.value.slice(-2)}</li>
                ))}
              </ul>
            </div>
            <div className="mt-6">
              <p className="text-sm font-semibold">Observations jointes ({observations.length})</p>
              <ul className="mt-1 space-y-1 text-sm">
                {observations.map((o) => (
                  <li key={o.id}>
                    {o.source} — <FormatDateTime date={o.capturedAt} /> — ±{o.accuracyRadiusM ?? "?"} m
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-8 border-t border-gray-300 pt-4 text-xs leading-relaxed text-gray-500">
              Document établi à partir des déclarations du propriétaire, le {new Date().toLocaleString("fr-FR")}.
              Ce récapitulatif n&apos;est pas un procès-verbal officiel et n&apos;atteste pas par lui-même d&apos;un vol.
              Les identifiants sont partiellement masqués ; les originaux se présentent dans le cadre des procédures officielles.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
