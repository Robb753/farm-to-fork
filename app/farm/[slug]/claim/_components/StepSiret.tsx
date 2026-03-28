"use client";

import { useState, type ChangeEvent } from "react";
import { verifierSiret } from "@/lib/claim/actions";
import type { SiretVerificationResult } from "@/lib/claim/actions";

interface StepSiretProps {
  claimId: number;
  onSuccess: () => void;
  onSkip: () => void;
}

function formatSiret(v: string): string {
  const digits = v.replace(/\D/g, "").slice(0, 14);
  return digits.replace(
    /(\d{2})(\d{3})(\d{3})(\d{5})(\d{1})/,
    "$1 $2 $3 $4 $5"
  );
}

export function StepSiret({ claimId, onSuccess, onSkip }: StepSiretProps) {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SiretVerificationResult | null>(null);
  const [serviceUnavailable, setServiceUnavailable] = useState(false);

  const digits = inputValue.replace(/\D/g, "");
  const isFormatValid = digits.length === 14;

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    const formatted = formatSiret(e.target.value);
    setInputValue(formatted);
    // Reset result si l'utilisateur modifie le champ
    if (result) {
      setResult(null);
      setServiceUnavailable(false);
    }
  }

  async function handleVerify() {
    if (!isFormatValid) return;
    setLoading(true);
    setResult(null);
    setServiceUnavailable(false);

    const res = await verifierSiret(claimId, digits);
    setResult(res);

    if (!res.success) {
      const isUnavailable = res.error.startsWith(
        "Service de vérification temporairement indisponible"
      );
      setServiceUnavailable(isUnavailable);
    }

    setLoading(false);
  }

  function handleReset() {
    setInputValue("");
    setResult(null);
    setServiceUnavailable(false);
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Votre numéro SIRET permet de confirmer l&apos;identité de votre
        exploitation agricole. Cette étape est facultative.
      </p>

      {/* Champ SIRET + bouton vérifier */}
      {!(result && result.success) && (
        <div className="space-y-3">
          <label
            htmlFor="siret-input"
            className="block text-sm font-medium text-foreground"
          >
            Numéro SIRET
          </label>
          <input
            id="siret-input"
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="XX XXX XXX XXXXX X"
            maxLength={18}
            disabled={loading}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-base font-mono tracking-widest placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
          />
          {inputValue.length > 0 && !isFormatValid && (
            <p className="text-xs text-amber-600">
              Le SIRET doit contenir 14 chiffres.
            </p>
          )}

          <button
            type="button"
            onClick={handleVerify}
            disabled={!isFormatValid || loading}
            className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Vérification en cours…" : "Vérifier le SIRET"}
          </button>
        </div>
      )}

      {/* Résultat erreur */}
      {result && !result.success && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {result.error}
        </div>
      )}

      {/* Résultat succès */}
      {result && result.success && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <svg
              className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <p className="font-semibold text-emerald-800">
                {result.companyName}
              </p>
              <p className="text-xs text-emerald-600 font-mono mt-0.5">
                SIRET {result.siret.replace(/(\d{2})(\d{3})(\d{3})(\d{5})(\d{1})/, "$1 $2 $3 $4 $5")}
              </p>
              {result.isAgriculture && (
                <p className="text-xs text-emerald-700 mt-1">
                  Activité agricole détectée ✓
                </p>
              )}
            </div>
          </div>

          <p className="text-sm font-medium text-emerald-900">
            C&apos;est bien votre entreprise ?
          </p>

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onSuccess}
              className="w-full rounded-md bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
            >
              Oui, continuer
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              Ce n&apos;est pas ma fiche
            </button>
          </div>
        </div>
      )}

      {/* Bouton Passer — plus visible si service indisponible */}
      <div className="pt-2 border-t border-border">
        {serviceUnavailable ? (
          <button
            type="button"
            onClick={onSkip}
            className="w-full rounded-md border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
          >
            Passer cette étape
          </button>
        ) : (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Passer cette étape
          </button>
        )}
      </div>
    </div>
  );
}
