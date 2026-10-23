// Agent Albatros — cercles de confiance et partages explicites (F-050 … F-054)
"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import { EmptyState, HonestyNote, StepUpDialog, FormatDateTime } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { formatAgo } from "@/lib/albatros";
import type { Circle, Incident } from "./types";
import {
  Users, Plus, Loader2, UserPlus, Share2, Trash2, X, ShieldCheck, Clock, Hand,
} from "lucide-react";

export function CirclesView() {
  const { toast } = useToast();
  const { refreshKey, refresh } = useAlbatros();
  const [circles, setCircles] = useState<Circle[] | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteFor, setInviteFor] = useState<Circle | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteContact, setInviteContact] = useState("");
  const [shareFor, setShareFor] = useState<Circle | null>(null);
  const [shareData, setShareData] = useState("alert");
  const [shareDuration, setShareDuration] = useState("24");
  const [shareIncident, setShareIncident] = useState("");
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = () => api.circles().then((r) => setCircles(r.circles)).catch(() => setCircles([]));
  useEffect(() => {
    load();
    api.incidents().then((r) => setIncidents(r.incidents)).catch(() => {});
     
  }, [refreshKey]);

  const create = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await api.createCircle(newName.trim());
      toast({ title: "Cercle créé", description: "Aucune position n'est partagée par défaut (F-023)." });
      setCreateOpen(false); setNewName("");
      load(); refresh();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const invite = async () => {
    if (!inviteFor || !inviteName.trim() || !inviteContact.trim()) return;
    setBusy(true);
    try {
      const res = await api.inviteMember(inviteFor.id, inviteName.trim(), inviteContact.trim());
      toast({ title: "Invitation envoyée", description: res.notice });
      setInviteFor(null); setInviteName(""); setInviteContact("");
      load();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const createShare = async (ticket: string) => {
    if (!shareFor) return;
    setBusy(true);
    try {
      const res = await api.createShareGrant({
        circle_id: shareFor.id,
        incident_id: shareIncident || undefined,
        data_shared: shareData,
        duration_hours: Number(shareDuration),
        step_up_ticket: ticket,
      });
      toast({ title: "Partage actif", description: res.notice });
      setShareFor(null); setShareData("alert"); setShareDuration("24"); setShareIncident("");
      load(); refresh();
    } catch (e) {
      toast({ title: "Partage impossible", description: e instanceof ApiError ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const dataLabel = (d: string) => d === "alert" ? "Alerte" : d === "status" ? "Statut du dossier" : "Position";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Cercles de confiance</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Alertez vos proches sans jamais leur donner d&apos;accès permanent à vos positions.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Créer un cercle
        </Button>
      </div>

      {!circles ? (
        <Skeleton className="h-48 rounded-xl" />
      ) : circles.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun cercle"
          hint="Un cercle regroupe des proches que vous invitez et qui acceptent explicitement. L'adhésion ne donne accès à aucune position par défaut."
          action={<Button onClick={() => setCreateOpen(true)} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4" /> Créer un cercle</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {circles.map((c) => {
            const activeGrants = c.shareGrants.filter((g) => !g.revokedAt && new Date(g.expiresAt) > new Date());
            return (
              <div key={c.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.members.length} membre(s) · créé <FormatDateTime date={c.createdAt} pattern="d MMM yyyy" />
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost" size="icon" aria-label="Supprimer le cercle"
                    onClick={async () => {
                      await api.deleteCircle(c.id).catch(() => {});
                      toast({ title: "Cercle supprimé", description: "Les partages associés sont révoqués." });
                      load(); refresh();
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                <div className="mt-4 space-y-2">
                  {c.members.length === 0 && <p className="text-xs text-muted-foreground">Aucun membre pour l&apos;instant.</p>}
                  {c.members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-secondary/40 px-3 py-2">
                      <div className="flex items-center gap-2.5 text-sm">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary">
                          {m.inviteName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div>{m.inviteName}</div>
                          <div className="text-[11px] text-muted-foreground">{m.inviteContact}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] ${
                          m.status === "active" ? "bg-emerald-950/50 text-emerald-300" : "bg-secondary text-muted-foreground"
                        }`}>
                          {m.status === "active" ? "actif" : m.status === "invited" ? "invité" : m.status}
                        </span>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7" aria-label={`Retirer ${m.inviteName}`}
                          onClick={async () => {
                            await api.removeMember(c.id, m.id).catch(() => {});
                            toast({ title: "Membre retiré", description: "Les partages en cours sont révoqués." });
                            load();
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {activeGrants.length > 0 && (
                  <div className="mt-3 space-y-1.5 rounded-lg border border-primary/25 bg-primary/5 p-3">
                    {activeGrants.map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <Share2 className="h-3.5 w-3.5 text-primary" />
                          Partage « {dataLabel(g.dataShared)} »
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" /> expire {formatAgo(g.expiresAt).replace("il y a", "dans")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setInviteFor(c)}>
                    <UserPlus className="h-3.5 w-3.5" /> Inviter
                  </Button>
                  <Button size="sm" onClick={() => setShareFor(c)} className="bg-primary hover:bg-primary/90">
                    <Share2 className="h-3.5 w-3.5" /> Partager…
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <HonestyNote>
        <strong>Anti-abus (F-054) :</strong> les destinataires peuvent quitter un cercle, bloquer des invitations et
        signaler un usage abusif. Un partage de position exige une vérification renforcée, expire automatiquement et
        se révoque à tout moment. Les membres ne voient <strong>jamais</strong> l&apos;historique complet ni les
        identifiants d&apos;appareil.
      </HonestyNote>

      {/* Dialogue création */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Créer un cercle</DialogTitle>
            <DialogDescription>Ex. « Famille & proches ». Aucun partage n&apos;est activé à la création.</DialogDescription>
          </DialogHeader>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Nom du cercle" onKeyDown={(e) => e.key === "Enter" && create()} />
          <Button onClick={create} disabled={busy || !newName.trim()} className="bg-primary hover:bg-primary/90">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Créer
          </Button>
        </DialogContent>
      </Dialog>

      {/* Dialogue invitation */}
      <Dialog open={!!inviteFor} onOpenChange={(o) => !o && setInviteFor(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Inviter un proche — {inviteFor?.name}</DialogTitle>
            <DialogDescription>
              L&apos;invitation est révocable. Le proche doit accepter explicitement avant tout envoi d&apos;alerte,
              et son adhésion ne lui donne accès à aucune position (F-023).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nom</Label>
              <Input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Koffi Hounsou" />
            </div>
            <div className="space-y-1.5">
              <Label>Contact (téléphone ou email)</Label>
              <Input value={inviteContact} onChange={(e) => setInviteContact(e.target.value)} placeholder="+229 97 00 00 42" />
            </div>
            <Button onClick={invite} disabled={busy || !inviteName.trim() || !inviteContact.trim()} className="w-full bg-primary hover:bg-primary/90">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Envoyer l&apos;invitation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialogue partage */}
      <Dialog open={!!shareFor} onOpenChange={(o) => { if (!o) setShareFor(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" /> Partager avec {shareFor?.name}</DialogTitle>
            <DialogDescription>
              Vous choisissez exactement ce qui est partagé, avec qui, et pour combien de temps. Exige une vérification
              renforcée (F-003, F-051).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Information partagée</Label>
              <Select value={shareData} onValueChange={setShareData}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alert">Alerte d&apos;incident (sans position)</SelectItem>
                  <SelectItem value="status">Statut du dossier</SelectItem>
                  <SelectItem value="position">Position (la plus sensible)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Dossier concerné (facultatif)</Label>
              <Select value={shareIncident} onValueChange={setShareIncident}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {incidents.map((i) => (
                    <SelectItem key={i.id} value={i.id}>{i.refNumber}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durée</Label>
              <Select value={shareDuration} onValueChange={setShareDuration}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 heure</SelectItem>
                  <SelectItem value="24">24 heures</SelectItem>
                  <SelectItem value="72">3 jours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => setStepUpOpen(true)} disabled={busy} className="w-full bg-primary hover:bg-primary/90">
              <ShieldCheck className="h-4 w-4" /> Continuer avec vérification renforcée
            </Button>
            <p className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <Hand className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Les membres peuvent refuser les alertes et quitter le cercle à tout moment — le contrôle reste partagé,
              jamais imposé.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <StepUpDialog
        open={stepUpOpen}
        onOpenChange={setStepUpOpen}
        onVerified={createShare}
        title="Autoriser le partage"
      />
    </div>
  );
}
