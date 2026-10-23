// Agent Albatros — composants partagés (identité, badges, transparence, step-up F-003)
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import {
  INCIDENT_STATUSES, OBSERVATION_SOURCES, formatAgo, maskIdentifier,
  type IncidentStatus, type ObservationSource,
} from "@/lib/albatros";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck, Info } from "lucide-react";

// ---------- Identité de marque ----------
// Emblème officiel (albatros + bouclier GPS) — asset transparent généré
// depuis le logo source via scripts/build_emblem_transparent.py
export function AlbatrosMark({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/brand/albatros-emblem.png"
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      priority
      draggable={false}
      className={`shrink-0 dark:drop-shadow-[0_0_10px_rgba(229,57,69,0.4)] ${className}`}
    />
  );
}

// Lockup officiel : emblème + ALBATROS surmontant PROTECT (filets rouges,
// conformément au logo « Albatros Protect en vol »)
export function AlbatrosLogo({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <AlbatrosMark size={size} />
      <div className="leading-none">
        <div className="font-semibold tracking-wide text-foreground" style={{ fontSize: size * 0.42 }}>
          ALBATROS
        </div>
        <div className="mt-1 flex items-center gap-1.5">
          <span aria-hidden="true" className="h-px shrink-0 rounded-full bg-primary" style={{ width: Math.max(6, size * 0.24) }} />
          <div className="font-bold tracking-widest text-primary" style={{ fontSize: size * 0.46 }}>
            PROTECT
          </div>
          <span aria-hidden="true" className="h-px shrink-0 rounded-full bg-primary" style={{ width: Math.max(6, size * 0.24) }} />
        </div>
      </div>
    </div>
  );
}

// ---------- Badges ----------
export function SourceBadge({ source, short = false }: { source: string; short?: boolean }) {
  const cfg = OBSERVATION_SOURCES[source as ObservationSource];
  if (!cfg) return (
    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-2.5 py-0.5 text-xs text-muted-foreground">
      Source inconnue
    </span>
  );
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium"
      style={{ borderColor: `${cfg.color}55`, color: cfg.color, background: `${cfg.color}12` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
      {short ? cfg.short : cfg.label}
    </span>
  );
}

// §5.4 — badges de statut : vert confirmé, orange action requise, rouge critique,
// gris neutre, bleu information. Toujours avec libellé (jamais la couleur seule).
const TONE_CLASSES: Record<string, string> = {
  neutral: "border-border bg-secondary text-muted-foreground",
  info: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/50 dark:text-blue-300",
  warn: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/50 dark:text-orange-300",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-600 dark:text-emerald-300",
  danger: "border-red-200 bg-[#FFF0F1] text-[#B91F2B] dark:border-red-900/60 dark:bg-red-950/50 dark:text-[#B91F2B] dark:text-red-300",
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = INCIDENT_STATUSES[status as IncidentStatus] ?? { label: status, tone: "neutral" as const };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[cfg.tone]}`}>
      {cfg.label}
    </span>
  );
}

export function FreshnessTag({ capturedAt, accuracyM }: { capturedAt: string; accuracyM?: number | null }) {
  return (
    <span className="text-xs text-muted-foreground">
      {formatAgo(capturedAt)}
      {accuracyM ? ` · ±${Math.round(accuracyM)} m` : " · précision inconnue"}
    </span>
  );
}

// ---------- Transparence ----------
export function HonestyNote({ children, variant = "info", className = "" }: {
  children: React.ReactNode; variant?: "info" | "warn"; className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
        variant === "warn"
          ? "border-amber-300/70 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/20 text-amber-700 dark:text-amber-200/90"
          : "border-border bg-secondary/40 text-muted-foreground"
      } ${className}`}
    >
      <Info className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint, action }: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; hint?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
      <Icon className="h-10 w-10 text-muted-foreground/50 mb-4" />
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 max-w-md text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ---------- Identifiant masqué (F-015) ----------
export function MaskedIdentifier({ value, label }: { value: string; label?: string }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <code className="rounded bg-secondary px-2 py-0.5 text-xs">
        {revealed ? value : maskIdentifier(value)}
      </code>
      <Button
        variant="ghost" size="icon" className="h-6 w-6"
        onClick={() => setRevealed((r) => !r)}
        aria-label={revealed ? "Masquer" : "Afficher (sensible)"}
        title={revealed ? "Masquer" : "Afficher — consultation journalisée"}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

// ---------- Vérification renforcée (F-003) ----------
export function StepUpDialog({ open, onOpenChange, onVerified, title = "Vérification renforcée requise" }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onVerified: (ticket: string) => void;
  title?: string;
}) {
  const { toast } = useToast();
  const user = useAlbatros((s) => s.user);
  const identifier = user?.phone ?? user?.email ?? "";
  const [step, setStep] = useState<"idle" | "code">("idle");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const send = async () => {
    setLoading(true);
    try {
      const res = await api.otpStart(identifier, "step_up");
      setDemoCode(res.demo_code);
      setStep("code");
      toast({
        title: "Code envoyé",
        description: res.demo_notice,
      });
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const res = await api.otpVerify(identifier, code, "step_up");
      if (res.step_up_ticket) {
        onVerified(res.step_up_ticket);
        onOpenChange(false);
        setStep("idle");
        setCode("");
        setDemoCode(null);
      }
    } catch (e) {
      toast({
        title: "Code refusé",
        description: e instanceof ApiError ? e.message : "Code invalide ou expiré.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setStep("idle"); setCode(""); setDemoCode(null); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Cette action sensible exige un second facteur (exigence F-003 du cahier des charges).
            Un code à usage unique est envoyé à votre identifiant vérifié&nbsp;: <strong>{identifier}</strong>.
          </DialogDescription>
        </DialogHeader>

        {step === "idle" && (
          <div className="space-y-4">
            <Button onClick={send} disabled={loading} className="w-full">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              Recevoir le code de vérification
            </Button>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            {demoCode && (
              <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900/60 dark:bg-amber-950/30">
                <p className="font-medium text-amber-700 dark:text-amber-600 dark:text-amber-300">Mode pilote — code affiché à l'écran :</p>
                <p className="font-mono text-xl tracking-[0.4em] text-amber-800 dark:text-amber-700 dark:text-amber-200">{demoCode}</p>
              </div>
            )}
            <div className="flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <Button onClick={verify} disabled={code.length !== 6 || loading} className="w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Valider
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle };
export function FormatDateTime({ date, pattern = "d MMM yyyy 'à' HH:mm" }: { date: string; pattern?: string }) {
  return <>{format(new Date(date), pattern, { locale: fr })}</>;
}
