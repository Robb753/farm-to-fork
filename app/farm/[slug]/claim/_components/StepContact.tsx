"use client";

import { useState, useTransition } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitClaimRequest, type SubmitClaimResult } from "@/lib/claim/actions";

interface StepContactProps {
  listingId: number;
  listingName: string;
  listingAddress: string | null;
  onSuccess: (result: Extract<SubmitClaimResult, { success: true }>) => void;
}

const PHONE_REGEX = /^(\+33|0)[1-9](\d{8})$/;

export function StepContact({
  listingId,
  listingName,
  listingAddress,
  onSuccess,
}: StepContactProps) {
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Pré-remplissage email Clerk
  const defaultEmail =
    user?.primaryEmailAddress?.emailAddress ?? "";
  const defaultName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);

    // Validation côté client (pré-check)
    const phone = (fd.get("contactPhone") as string | null)?.trim() ?? "";
    if (phone && !PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
      setError("Téléphone invalide. Format attendu : 06 12 34 56 78 ou +33612345678");
      return;
    }

    startTransition(async () => {
      const result = await submitClaimRequest(fd);
      if (!result.success) {
        setError(result.error);
        return;
      }
      onSuccess(result);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Farm recap */}
      <div className="rounded-xl border bg-muted/40 p-4 space-y-1">
        <p className="font-semibold text-foreground">{listingName}</p>
        {listingAddress && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            {listingAddress}
          </p>
        )}
      </div>

      {/* Hidden listingId */}
      <input type="hidden" name="listingId" value={listingId} />

      {/* Nom complet */}
      <div className="space-y-1.5">
        <Label htmlFor="contactName">Nom complet *</Label>
        <Input
          id="contactName"
          name="contactName"
          type="text"
          required
          minLength={2}
          defaultValue={defaultName}
          placeholder="Marie Dupont"
          autoComplete="name"
          disabled={isPending}
        />
      </div>

      {/* Email professionnel */}
      <div className="space-y-1.5">
        <Label htmlFor="contactEmail">Email professionnel *</Label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="marie@ferme-dupont.fr"
          autoComplete="email"
          disabled={isPending}
        />
        <p className="text-xs text-muted-foreground">
          Le code de vérification sera envoyé à cet email.
        </p>
      </div>

      {/* Téléphone */}
      <div className="space-y-1.5">
        <Label htmlFor="contactPhone">
          Téléphone
          <span className="text-muted-foreground font-normal ml-1">(pour la vérification SMS)</span>
        </Label>
        <Input
          id="contactPhone"
          name="contactPhone"
          type="tel"
          placeholder="06 12 34 56 78"
          autoComplete="tel"
          disabled={isPending}
        />
      </div>

      {/* Message optionnel */}
      <div className="space-y-1.5">
        <Label htmlFor="message">
          Message
          <span className="text-muted-foreground font-normal ml-1">(optionnel)</span>
        </Label>
        <Textarea
          id="message"
          name="message"
          rows={3}
          maxLength={300}
          placeholder="Précisez si nécessaire pourquoi vous revendiquez cette fiche..."
          disabled={isPending}
        />
      </div>

      {/* Erreur */}
      {error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-emerald-600 hover:bg-emerald-700"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Continuer
      </Button>
    </form>
  );
}
