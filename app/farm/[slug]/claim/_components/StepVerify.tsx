"use client";

import { useRef, useState, useEffect, useTransition, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { verifyCode, sendVerificationCode } from "@/lib/claim/actions";

const CODE_LENGTH = 6;
const CODE_TTL_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN = 60; // 60s avant de pouvoir renvoyer

interface StepVerifyProps {
  claimId: number;
  method: "email" | "sms";
  contactEmail: string;
  contactPhone: string | null;
  onSuccess: (listingSlug: string) => void;
}

export function StepVerify({
  claimId,
  method,
  contactEmail,
  contactPhone,
  onSuccess,
}: StepVerifyProps) {
  // ─── State ────────────────────────────────────────────────────────────────
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [error, setError] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState<number>(5);
  const [isPending, startTransition] = useTransition();
  const [isResending, startResendTransition] = useTransition();

  // Compte à rebours 10:00
  const [remaining, setRemaining] = useState(CODE_TTL_SECONDS);
  // Cooldown "Renvoyer le code"
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);

  const inputRefs = useRef<(HTMLInputElement | null)[]>(
    Array(CODE_LENGTH).fill(null)
  );

  // ─── Timers ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (remaining <= 0) return;
    const id = setInterval(() => setRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(
      () => setResendCooldown((s) => Math.max(0, s - 1)),
      1000
    );
    return () => clearInterval(id);
  }, [resendCooldown]);

  // ─── Focus premier input au montage ──────────────────────────────────────
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = String(Math.floor(secs / 60)).padStart(2, "0");
    const s = String(secs % 60).padStart(2, "0");
    return `${m}:${s}`;
  };

  const focusInput = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(CODE_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
  }, []);

  // ─── Handlers inputs ─────────────────────────────────────────────────────
  function handleChange(index: number, value: string) {
    // Accepte seulement un chiffre
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = char;
    setDigits(next);

    if (char && index < CODE_LENGTH - 1) {
      focusInput(index + 1);
    }
  }

  function handleKeyDown(
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (e.key === "Backspace") {
      if (digits[index]) {
        // Efface la valeur courante
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      } else {
        // Input déjà vide → recule
        focusInput(index - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusInput(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusInput(index + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, CODE_LENGTH);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < CODE_LENGTH; i++) {
      next[i] = pasted[i] ?? "";
    }
    setDigits(next);

    // Focus sur le dernier chiffre rempli (ou le dernier input)
    const lastFilled = Math.min(pasted.length - 1, CODE_LENGTH - 1);
    focusInput(lastFilled);
  }

  // ─── Submit ───────────────────────────────────────────────────────────────
  function handleSubmit() {
    const code = digits.join("");
    if (code.length < CODE_LENGTH) {
      setError("Saisissez les 6 chiffres du code.");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await verifyCode(claimId, code);
      if (!result.success) {
        setError(result.error);
        if (result.attemptsLeft !== undefined) {
          setAttemptsLeft(result.attemptsLeft);
        }
        // Reset les inputs
        setDigits(Array(CODE_LENGTH).fill(""));
        focusInput(0);
        return;
      }
      onSuccess(result.listingSlug);
    });
  }

  // ─── Renvoyer le code ─────────────────────────────────────────────────────
  function handleResend() {
    setError(null);
    setDigits(Array(CODE_LENGTH).fill(""));

    startResendTransition(async () => {
      const result = await sendVerificationCode(claimId, method);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setRemaining(CODE_TTL_SECONDS);
      setResendCooldown(RESEND_COOLDOWN);
      setAttemptsLeft(5);
      focusInput(0);
    });
  }

  // ─── UI ───────────────────────────────────────────────────────────────────
  const isExpired = remaining === 0;
  const codeComplete = digits.every((d) => d !== "");
  const destination = method === "email" ? contactEmail : (contactPhone ?? "");

  return (
    <div className="space-y-5">
      {/* Description */}
      <p className="text-sm text-muted-foreground">
        Code envoyé à{" "}
        <strong className="text-foreground font-medium">{destination}</strong>.
        Saisissez-le ci-dessous.
      </p>

      {/* 6 inputs */}
      <div className="flex justify-center gap-2 sm:gap-3">
        {Array.from({ length: CODE_LENGTH }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digits[i]}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            disabled={isPending || isExpired}
            aria-label={`Chiffre ${i + 1}`}
            className={cn(
              "w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-all",
              "focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100",
              digits[i]
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-foreground",
              (isPending || isExpired) && "opacity-50 cursor-not-allowed"
            )}
          />
        ))}
      </div>

      {/* Timer */}
      <div className="flex items-center justify-between text-sm">
        <span
          className={cn(
            "font-mono font-medium",
            remaining <= 60 && remaining > 0
              ? "text-amber-600"
              : remaining === 0
                ? "text-destructive"
                : "text-muted-foreground"
          )}
        >
          {isExpired ? "Code expiré" : `Expire dans ${formatTime(remaining)}`}
        </span>
        <span className="text-muted-foreground">
          {attemptsLeft} tentative{attemptsLeft > 1 ? "s" : ""} restante
          {attemptsLeft > 1 ? "s" : ""}
        </span>
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Bouton Vérifier */}
      <Button
        onClick={handleSubmit}
        disabled={isPending || isExpired || !codeComplete}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Vérifier
      </Button>

      {/* Bouton Renvoyer */}
      <div className="text-center">
        {resendCooldown > 0 ? (
          <p className="text-xs text-muted-foreground">
            Renvoyer dans{" "}
            <span className="font-medium tabular-nums">{resendCooldown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors disabled:opacity-50"
          >
            {isResending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <RefreshCw className="h-3 w-3" />
            )}
            Renvoyer le code
          </button>
        )}
      </div>
    </div>
  );
}
