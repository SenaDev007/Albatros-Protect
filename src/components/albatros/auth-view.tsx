// Agent Albatros — authentification (OTP téléphone/email, F-001/F-002)
"use client";

import { useState } from "react";
import { api, ApiError } from "./api";
import { useAlbatros } from "./store";
import { AlbatrosLogo } from "./shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Smartphone, Mail, ShieldCheck } from "lucide-react";
import type { SessionUser } from "./types";

export function AuthView() {
  const { setView, setSessionUser } = useAlbatros();
  const { toast } = useToast();
  const [step, setStep] = useState<"identifier" | "code">("identifier");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const start = async () => {
    if (identifier.trim().length < 5) {
      toast({ title: "Identifiant invalide", description: "Entrez un numéro de téléphone ou un email.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await api.otpStart(identifier, "login");
      setDemoCode(res.demo_code);
      setStep("code");
    } catch (e) {
      toast({ title: "Erreur", description: e instanceof Error ? e.message : "Erreur", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const res = await api.otpVerify(identifier, code, "login");
      if (res.user) {
        setSessionUser(res.user as SessionUser);
        setView("dashboard");
        toast({
          title: res.created ? "Compte créé" : "Bienvenue",
          description: res.created
            ? "Votre compte vérifié est actif. Complétez votre profil dans Paramètres."
            : `Connecté — ${res.user.fullName}`,
        });
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

  const isEmail = identifier.includes("@");

  return (
    <div className="flex min-h-screen flex-col">
      <div className="hero-grid flex flex-1 flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center gap-4">
            <button onClick={() => setView("landing")} className="transition-transform hover:scale-105">
              <AlbatrosLogo size={38} />
            </button>
            <p className="text-sm text-muted-foreground">
              {step === "identifier"
                ? "Connexion ou création de compte avec un identifiant vérifiable"
                : `Code envoyé à ${identifier}`}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-8 albatros-glow-box">
            {step === "identifier" ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="identifier">Téléphone ou email</Label>
                  <div className="relative">
                    {isEmail
                      ? <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      : <Smartphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />}
                    <Input
                      id="identifier"
                      className="pl-10 h-12 bg-secondary/50"
                      placeholder="+229 97 00 00 01"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && start()}
                      autoComplete="tel"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Un code à 6 chiffres valide votre identifiant. Aucun mot de passe à retenir — et les
                    secrets de récupération ne sont jamais affichés en clair.
                  </p>
                </div>
                <Button onClick={start} disabled={loading} className="h-12 w-full bg-primary hover:bg-primary/90">
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Recevoir le code
                </Button>
                <button
                  onClick={() => setIdentifier("+22997000001")}
                  className="mx-auto block text-xs text-primary underline-offset-2 hover:underline"
                >
                  Utiliser le compte de démonstration (+22997000001)
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {demoCode && (
                  <div className="rounded-lg border border-amber-300/70 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30 px-4 py-3 text-sm">
                    <p className="font-medium text-amber-600 dark:text-amber-300">Mode pilote — votre code :</p>
                    <p className="font-mono text-2xl tracking-[0.4em] text-amber-700 dark:text-amber-200">{demoCode}</p>
                    <p className="mt-1 text-xs text-amber-700/70 dark:text-amber-700 dark:text-amber-200/70">
                      En production, ce code arrive par SMS ou email et n&apos;est jamais affiché ici.
                    </p>
                  </div>
                )}
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-10 border-border" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button
                  onClick={verify} disabled={code.length !== 6 || loading}
                  className="h-12 w-full bg-primary hover:bg-primary/90"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <ShieldCheck className="h-4 w-4" />
                  Vérifier et continuer
                </Button>
                <button
                  onClick={() => { setStep("identifier"); setCode(""); setDemoCode(null); }}
                  className="mx-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" /> Changer d&apos;identifiant
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] leading-relaxed text-muted-foreground">
            En continuant, vous acceptez la notice de confidentialité du service pilote.
            Les données de localisation sont traitées comme sensibles conformément au Code du numérique
            béninois (Loi n° 2017-20), sous réserve des formalités APDP applicables.
          </p>
        </div>
      </div>
    </div>
  );
}
