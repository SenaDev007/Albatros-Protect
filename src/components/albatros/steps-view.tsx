// Albatros Protect — Démarches et documents (§6.2 : documents, pièces, droits, instructions officielles)
"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useAlbatros } from "./store";
import { EmptyState, HonestyNote, FormatDateTime } from "./shared";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { DocumentFile, PrivacyRequestItem } from "./types";
import {
  ClipboardList, Upload, FileText, Scale, Phone, ShieldCheck, Loader2, Lock, Landmark,
} from "lucide-react";

const PRIV_LABELS: Record<string, string> = {
  access: "Accès à mes données",
  rectification: "Rectification",
  deletion: "Suppression",
  objection: "Opposition",
};

export function StepsView() {
  const { refreshKey, refresh } = useAlbatros();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<DocumentFile[] | null>(null);
  const [privacy, setPrivacy] = useState<PrivacyRequestItem[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api.documents().then((r) => setDocuments(r.documents)).catch(() => setDocuments([]));
    api.privacyRequests().then((r) => setPrivacy(r.requests)).catch(() => setPrivacy([]));
  };
  useEffect(() => { load();   }, [refreshKey]);

  const upload = async () => {
    const name = window.prompt("Nom de la pièce (ex. Facture iStore Bénin) :");
    if (!name) return;
    setBusy(true);
    try {
      const res = await api.uploadDocument({ name, type: "other", size_kb: 320 });
      toast({ title: "Pièce déposée", description: res.notice });
      load(); refresh();
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Démarches et documents</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Vos pièces justificatives chiffrées, vos demandes de droits et les instructions officielles
          de vos démarches.
        </p>
      </div>

      {/* Pièces justificatives */}
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4 text-primary" /> Mes pièces justificatives
          </h3>
          <Button variant="outline" size="sm" onClick={upload} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />} Déposer une pièce
          </Button>
        </div>
        {!documents ? <Skeleton className="mt-4 h-20 rounded-lg" /> : documents.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune pièce pour l&apos;instant. Les factures et justificatifs facilitent la vérification
            de propriété et les démarches ultérieures.
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {documents.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg bg-secondary/40 px-3 py-2.5 text-sm">
                <Lock className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate">{d.name}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">{d.sizeKb} Ko</span>
                <span className="text-xs text-muted-foreground">
                  conserve jusqu&apos;au {d.expiresAt ? <FormatDateTime date={d.expiresAt} pattern="d MMM yyyy" /> : "—"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Instructions officielles (F-063) */}
      <section className="grid gap-4 md:grid-cols-2">
        {[
          {
            icon: ShieldCheck,
            title: "Sécuriser vos comptes",
            steps: [
              "Changez les mots de passe de vos emails, réseaux sociaux et applications bancaires depuis un appareil de confiance.",
              "Déconnectez les sessions ouvertes sur l'appareil perdu (fonction disponible dans la plupart des services).",
              "Activez la vérification en deux étapes partout où elle est proposée.",
            ],
          },
          {
            icon: Phone,
            title: "Contacter votre opérateur (SIM)",
            steps: [
              "MTN Bénin — service client 111 (canal officiel à vérifier).",
              "Moov Africa Bénin — service client 100 (canal officiel à vérifier).",
              "Celtiis (SBIN) — service client : contact à confirmer.",
              "Demandez la suspension de la SIM concernée — au pilote, aucune transmission automatique n'a lieu.",
            ],
          },
          {
            icon: Landmark,
            title: "Déposer plainte (vol)",
            steps: [
              "Rendez-vous au commissariat ou à la brigade de gendarmerie compétente (Parakou).",
              "Munissez-vous du récapitulatif exportable de votre dossier et d'une pièce d'identité.",
              "Conservez la référence de la plainte et ajoutez-la à votre dossier Albatros Protect.",
            ],
          },
          {
            icon: Scale,
            title: "Exercer vos droits sur vos données",
            steps: [
              "Accès, rectification, suppression, opposition : depuis Paramètres et confidentialité.",
              "Les durées de conservation par catégorie sont publiées dans le centre de confidentialité.",
              "Les demandes sont traitées conformément au Code du numérique (Loi n° 2017-20) et aux formalités APDP applicables.",
            ],
          },
        ].map((card) => (
          <div key={card.title} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <card.icon className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-sm font-semibold">{card.title}</h3>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
              {card.steps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary">{i + 1}.</span> {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {/* Demandes de droits */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Scale className="h-4 w-4 text-primary" /> Historique des demandes de droits
        </h3>
        {!privacy ? <Skeleton className="mt-4 h-16 rounded-lg" /> : privacy.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune demande enregistrée — vous pouvez en créer une depuis « Paramètres et confidentialité ».
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {privacy.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-3 py-2.5 text-sm">
                <span className="font-medium">{PRIV_LABELS[p.type] ?? p.type}</span>
                <span className="text-xs text-muted-foreground">
                  {p.status === "done" ? "traitée" : p.status === "processing" ? "en traitement" : "reçue"} ·{" "}
                  <FormatDateTime date={p.createdAt} pattern="d MMM yyyy" />
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <HonestyNote>
        <div className="flex items-start gap-2">
          <ClipboardList className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Ces instructions sont des repères : les contacts et procédures officiels béninois seront
            vérifiés avant publication (F-063). Tant qu&apos;aucune convention n&apos;est signée,
            <strong> aucune demande n&apos;est transmise automatiquement</strong> à un opérateur ou à une
            autorité — le dossier exportable reste la voie officielle.
          </span>
        </div>
      </HonestyNote>
    </div>
  );
}
