// Albatros Protect — Notifications (§7.8 : sobres, utiles, jamais de données sensibles)
"use client";

import { useEffect, useState } from "react";
import { api } from "./api";
import { useAlbatros } from "./store";
import { FormatDateTime, HonestyNote } from "./shared";
import { Skeleton } from "@/components/ui/skeleton";
import { formatAgo } from "@/lib/albatros";
import type { Device, Incident, Observation } from "./types";
import { Bell, BellRing, Siren, ShieldCheck, FileText, Info } from "lucide-react";

interface NotificationItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  detail: string;
  date: string;
}

// Les notifications sont dérivées de l'état réel du compte : aucune notification
// n'est générée pour remplir l'interface (§6.3 — recommandations liées à des règles réelles).
export function NotificationsView() {
  const { refreshKey } = useAlbatros();
  const [items, setItems] = useState<NotificationItem[] | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [d, i] = await Promise.all([api.devices(), api.incidents()]);
        if (!alive) return;
        const devices: Device[] = d.devices;
        const incidents: Incident[] = i.incidents;
        const list: NotificationItem[] = [];

        for (const inc of incidents) {
          if (inc.status === "closed") continue;
          list.push({
            id: `inc-${inc.id}`,
            icon: Siren,
            title: "Une mise à jour concerne votre dossier.",
            detail: `${inc.refNumber} — ${inc.type === "theft" ? "Vol" : "Perte"} · ${inc.locationText}. Consultez la chronologie pour le détail.`,
            date: inc.declaredAt,
          });
          if (inc.lastObservation) {
            const o = inc.lastObservation as Observation;
            list.push({
              id: `obs-${o.id}`,
              icon: BellRing,
              title: "Une observation a été reçue pour votre appareil enregistré.",
              detail: `Aucune coordonnée ne s'affiche ici — consultez la carte protégée pour la source, l'heure et la précision.`,
              date: o.receivedAt,
            });
          }
          if (inc.status === "verification_required") {
            list.push({
              id: `verif-${inc.id}`,
              icon: ShieldCheck,
              title: "Une action est nécessaire pour compléter votre signalement.",
              detail: `${inc.refNumber} attend un complément de vérification (preuve de propriété ou identifiants).`,
              date: inc.declaredAt,
            });
          }
        }
        for (const dev of devices) {
          if (dev.openIncident && !dev.proofUploaded) {
            list.push({
              id: `proof-${dev.id}`,
              icon: FileText,
              title: "Une action est nécessaire pour compléter votre signalement.",
              detail: `Ajoutez une preuve de propriété pour ${dev.brand} ${dev.model} afin de faciliter la vérification.`,
              date: dev.openIncident.declaredAt ?? dev.createdAt,
            });
          }
        }
        list.sort((a, b) => b.date.localeCompare(a.date));
        setItems(list);
      } catch {
        if (alive) setItems([]);
      }
    })();
    return () => { alive = false; };
  }, [refreshKey]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Des notifications sobres : aucune coordonnée, identifiant complet ni donnée sensible
          ne s&apos;affiche ici (§7.8).
        </p>
      </div>

      {!items ? (
        <div className="space-y-3"><Skeleton className="h-20 rounded-xl" /><Skeleton className="h-20 rounded-xl" /></div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <Bell className="h-10 w-10 text-muted-foreground/50 mb-4" />
          <p className="font-medium">Aucune notification</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Vous serez notifié des mises à jour de dossier, des actions à compléter et des
            observations reçues — uniquement lorsque quelque chose s&apos;est réellement produit.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div key={n.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <n.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium leading-snug">{n.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{n.detail}</p>
              </div>
              <span className="shrink-0 text-[11px] text-muted-foreground" title={n.date}>
                {formatAgo(n.date)}
              </span>
            </div>
          ))}
        </div>
      )}

      <HonestyNote>
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          En mode pilote, ces notifications sont dérivées de l&apos;état réel de votre compte (dossiers,
          observations, complétudes). Sur mobile, elles apparaîtront via le système de notification
          de l&apos;OS — sans coordonnées précises sur l&apos;écran verrouillé.
        </div>
      </HonestyNote>
    </div>
  );
}
