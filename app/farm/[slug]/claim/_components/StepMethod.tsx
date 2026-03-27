"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { sendVerificationCode } from "@/lib/claim/actions";

interface StepMethodProps {
  claimId: number;
  contactEmail: string;
  contactPhone: string | null;
  onSuccess: (method: "email" | "sms") => void;
}

const twilioEnabled =
  process.env.NEXT_PUBLIC_TWILIO_ENABLED === "true";

export function StepMethod({
  claimId,
  contactEmail,
  contactPhone,
  onSuccess,
}: StepMethodProps) {
  const [selected, setSelected] = useState<"email" | "sms" | null>("email");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const smsAvailable = twilioEnabled && !!contactPhone;

  function handleSend() {
    if (!selected) return;
    setError(null);

    startTransition(async () => {
      const result = await sendVerificationCode(claimId, selected);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onSuccess(selected);
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Choisissez comment recevoir votre code à 6 chiffres valable
        <strong className="text-foreground"> 10 minutes</strong>.
      </p>

      {/* Méthodes */}
      <div className="grid grid-cols-2 gap-3">
        {/* Email */}
        <button
          type="button"
          onClick={() => setSelected("email")}
          disabled={isPending}
          className={cn(
            "relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
            selected === "email"
              ? "border-emerald-600 bg-emerald-50"
              : "border-gray-200 hover:border-gray-300 bg-white"
          )}
          aria-pressed={selected === "email"}
        >
          <Mail
            className={cn(
              "h-6 w-6",
              selected === "email" ? "text-emerald-600" : "text-gray-400"
            )}
          />
          <div>
            <p className="font-semibold text-sm text-foreground">Par email</p>
            <p className="text-xs text-muted-foreground mt-0.5 break-all">
              {contactEmail}
            </p>
          </div>
          {/* Radio indicator */}
          <div
            className={cn(
              "absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center",
              selected === "email"
                ? "border-emerald-600"
                : "border-gray-300"
            )}
          >
            {selected === "email" && (
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
            )}
          </div>
        </button>

        {/* SMS */}
        <button
          type="button"
          onClick={() => smsAvailable && setSelected("sms")}
          disabled={isPending || !smsAvailable}
          className={cn(
            "relative flex flex-col items-start gap-3 rounded-xl border-2 p-4 text-left transition-all",
            !smsAvailable
              ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
              : selected === "sms"
                ? "border-emerald-600 bg-emerald-50"
                : "border-gray-200 hover:border-gray-300 bg-white"
          )}
          aria-pressed={selected === "sms"}
          aria-disabled={!smsAvailable}
        >
          <Smartphone
            className={cn(
              "h-6 w-6",
              !smsAvailable
                ? "text-gray-300"
                : selected === "sms"
                  ? "text-emerald-600"
                  : "text-gray-400"
            )}
          />
          <div>
            <p className="font-semibold text-sm text-foreground">Par SMS</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {!contactPhone
                ? "Aucun numéro renseigné"
                : !twilioEnabled
                  ? "Bientôt disponible"
                  : contactPhone}
            </p>
          </div>
          {/* Radio indicator */}
          <div
            className={cn(
              "absolute top-3 right-3 w-4 h-4 rounded-full border-2 flex items-center justify-center",
              selected === "sms" && smsAvailable
                ? "border-emerald-600"
                : "border-gray-300"
            )}
          >
            {selected === "sms" && smsAvailable && (
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
            )}
          </div>
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        onClick={handleSend}
        disabled={isPending || !selected}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Envoyer le code
      </Button>
    </div>
  );
}
