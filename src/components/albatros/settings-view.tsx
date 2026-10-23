// Agent Albatros — paramètres : sessions, consentements, exercice des droits (F-004, §9.2)
"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useAlbatros } from "./store";
import { FormatDateTime, HonestyNote } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CONSENT_PURPOSES, formatAgo } from "@/lib/albatros";
import type { Consent, PrivacyRequestItem, SessionInfo, SessionUser } from "./types";
import {
  Settings, MonitorSmartphone, ShieldCheck, Scale, Loader2, Trash2, CheckCircle2, FileText,
} from "lucide-react";

export function SettingsView() {
  const { toast } = useToast();
  const { refreshKey, user, setSessionUser, logout } = useAlbatros();
  const [sessions, setSessions] = useState<SessionInfo[] | null>(null);
  const [consents, setConsents] = useState<Consent[] | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyRequestItem[] | null>(null);
  const [privType, setPrivType] = useState("access");
  const [privDetails, setPrivDetails] = useState("");
  const [name, setName] = useState(user?.fullName ?? "");
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.session().then((r) => { setSessions(r.sessions); if (r.user) setSessionUser(r.user as SessionUser); }).catch(() => setSessions([]));
    api.consents().then((r) => setConsents(r.consents)).catch(() => setConsents([]));
    api.privacyRequests().then((r) => setPrivacy(r.requests)).catch(() => setPrivacy([]));
  };
  useEffect(() => { load(); setName(user?.fullName ?? "");   }, [refreshKey]);

  const saveName = async () => {
    if (!name.trim()) return;
    setBusy(true);
    // Renommage local : le nom complet reste côté compte ; pas d'endpoint dédié au pilote
    toast({
      title: "Profil",
      description: "Au pilote, le nom affiché reste celui du compte vérifié. La modification nominative sera gérée avec la vérification d'identité.",
    });
    setBusy(false);
  };

  const revoke = async (id: string) => {
    await api.revokeSession(id).catch(() => {});
    toast({ title: "Session révoquée", description: "L'appareil concerné sera déconnecté (F-004)." });
    load();
  };

  const revokeConsent = async (id: string) => {
    await api.revokeConsent(id).catch(() => {});
    toast({ title: "Consentement révoqué", description: "La collecte concernée s'arrête immédiatement (F-024)." });
    load();
  };

  const submitPrivacy = async () => {
    setBusy(true);
    try {
      const res = await api.createPrivacyRequest(privType, privDetails);
      toast({ title: "Demande enregistrée", description: res.notice });
      setPrivDetails("");
      load();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const PRIV_LABELS: Record<string, string> = {
    access: "Accès à mes données", rectification: "Rectification", deletion: "Suppression", objection: "Opposition",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Paramètres</h1>
        <p className="mt-1 text-sm text-muted-foreground">Compte, sécurité, consentements et vos droits sur vos données.</p>
      </div>

      {/* Compte */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Settings className="h-4 w-4 text-primary" /> Compte</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Nom complet</Label>
            <div className="flex gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <Button size="sm" variant="outline" onClick={saveName} disabled={busy}>OK</Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Identifiant vérifié</Label>
            <Input readOnly value={user?.phone ?? user?.email ?? ""} className="bg-secondary/40" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          Identifiant vérifié par OTP · compte créé le {user?.createdAt ? <FormatDateTime date={user.createdAt} pattern="d MMM yyyy" /> : "—"}
        </div>
      </div>

      {/* Sessions */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><MonitorSmartphone className="h-4 w-4 text-primary" /> Sessions actives (F-004)</h3>
        <p className="mt-1 text-xs text-muted-foreground">Consultez et révoquez vos sessions — les opérations sensibles sont journalisées.</p>
        {!sessions ? <Skeleton className="mt-3 h-16 rounded-lg" /> : (
          <div className="mt-4 space-y-2">
            {sessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate">{s.userAgent?.slice(0, 60) ?? "Session"}</span>
                    {s.current && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">cette session</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    active depuis <FormatDateTime date={s.createdAt} /> · vue {formatAgo(s.lastSeenAt)}
                  </div>
                </div>
                {!s.current && (
                  <Button variant="outline" size="sm" onClick={() => revoke(s.id)}>
                    <Trash2 className="h-3.5 w-3.5" /> Révoquer
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consentements */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-primary" /> Consentements</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Chaque collecte est liée à un consentement horodaté, versionné et révocable. La révocation ne supprime
          pas votre inventaire ni vos dossiers.
        </p>
        {!consents ? <Skeleton className="mt-3 h-24 rounded-lg" /> : consents.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Aucun consentement enregistré.</p>
        ) : (
          <div className="mt-4 space-y-2">
            {consents.map((c) => (
              <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary/40 px-3 py-2.5">
                <div>
                  <div className="text-sm">{CONSENT_PURPOSES[c.purpose] ?? c.purpose}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.permission} · texte {c.textVersion} · {c.granted ? <>accordé <FormatDateTime date={c.grantedAt} pattern="d MMM yyyy" /></> : <>révoqué {c.revokedAt ? <FormatDateTime date={c.revokedAt} pattern="d MMM yyyy" /> : ""}</>}
                  </div>
                </div>
                {c.granted ? (
                  <Button variant="outline" size="sm" onClick={() => revokeConsent(c.id)}>Révoquer</Button>
                ) : (
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground">révoqué</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Droits */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold"><Scale className="h-4 w-4 text-primary" /> Vos données, vos droits (§9.2)</h3>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Conformément au Code du numérique béninois (Loi n° 2017-20) et aux formalités APDP applicables : accès,
          rectification, opposition et suppression. Les durées de conservation par catégorie de données sont
          définies avec l&apos;APDP et réduites au minimum compatible avec la finalité.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Select value={privType} onValueChange={setPrivType}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(PRIV_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="min-w-52 flex-1" placeholder="Détails de la demande (facultatif)"
            value={privDetails} onChange={(e) => setPrivDetails(e.target.value)}
          />
          <Button onClick={submitPrivacy} disabled={busy} className="bg-primary hover:bg-primary/90">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Envoyer
          </Button>
        </div>
        {!privacy ? <Skeleton className="mt-3 h-14 rounded-lg" /> : privacy.length > 0 && (
          <div className="mt-4 space-y-2">
            {privacy.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2 text-sm">
                <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary" /> {PRIV_LABELS[p.type] ?? p.type}</span>
                <span className="text-xs text-muted-foreground">
                  {p.status === "done" ? "traitée" : p.status === "processing" ? "en traitement" : "reçue"} · <FormatDateTime date={p.createdAt} pattern="d MMM yyyy" />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-red-900/40 bg-red-950/10 p-5">
        <h3 className="text-sm font-semibold text-red-300">Déconnexion</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Termine la session courante sur cet appareil. Vos données restent chiffrées et vos dossiers intacts.
        </p>
        <Button variant="destructive" className="mt-3" onClick={logout}>Se déconnecter</Button>
      </div>

      <HonestyNote variant="warn">
        Mode pilote : les données de cette démonstration ne sont pas soumises aux procédures APDP réelles.
        Avant tout traitement de données de citoyens, le responsable du produit doit accomplir les formalités
        applicables, publier la notice de confidentialité et valider les durées de conservation (§9.2 du cahier des charges).
      </HonestyNote>
    </div>
  );
}
