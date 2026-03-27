"use client";

import { useState } from "react";
import { ClaimStepper } from "./ClaimStepper";
import { StepContact } from "./StepContact";
import { StepMethod } from "./StepMethod";
import { StepVerify } from "./StepVerify";
import { StepSuccess } from "./StepSuccess";
import type { SubmitClaimResult } from "@/lib/claim/actions";

interface ListingInfo {
  id: number;
  name: string | null;
  slug: string;
  address: string | null;
}

interface ClaimFlowProps {
  listing: ListingInfo;
}

type Step = 1 | 2 | 3 | 4;

interface ClaimState {
  claimId: number;
  listingName: string;
  listingSlug: string;
  contactEmail: string;
  contactPhone: string | null;
}

export function ClaimFlow({ listing }: ClaimFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [claimState, setClaimState] = useState<ClaimState | null>(null);
  const [method, setMethod] = useState<"email" | "sms">("email");
  const [finalSlug, setFinalSlug] = useState<string>(listing.slug);

  function handleContactSuccess(
    result: Extract<SubmitClaimResult, { success: true }>
  ) {
    setClaimState({
      claimId: result.claimId,
      listingName: result.listingName,
      listingSlug: result.listingSlug,
      contactEmail: result.contactEmail,
      contactPhone: result.contactPhone,
    });
    setStep(2);
  }

  function handleMethodSuccess(selectedMethod: "email" | "sms") {
    setMethod(selectedMethod);
    setStep(3);
  }

  function handleVerifySuccess(slug: string) {
    setFinalSlug(slug);
    setStep(4);
  }

  const stepLabels: Record<Step, string> = {
    1: "Qui êtes-vous ?",
    2: "Méthode de vérification",
    3: "Saisir le code",
    4: "Revendication confirmée",
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Stepper */}
      {step < 4 && (
        <div className="mb-8">
          <ClaimStepper currentStep={step} />
        </div>
      )}

      {/* Titre étape */}
      {step < 4 && (
        <h1 className="text-xl font-bold text-foreground mb-6">
          {stepLabels[step]}
        </h1>
      )}

      {/* Contenu */}
      {step === 1 && (
        <StepContact
          listingId={listing.id}
          listingName={listing.name ?? "Ferme sans nom"}
          listingAddress={listing.address}
          onSuccess={handleContactSuccess}
        />
      )}

      {step === 2 && claimState && (
        <StepMethod
          claimId={claimState.claimId}
          contactEmail={claimState.contactEmail}
          contactPhone={claimState.contactPhone}
          onSuccess={handleMethodSuccess}
        />
      )}

      {step === 3 && claimState && (
        <StepVerify
          claimId={claimState.claimId}
          method={method}
          contactEmail={claimState.contactEmail}
          contactPhone={claimState.contactPhone}
          onSuccess={handleVerifySuccess}
        />
      )}

      {step === 4 && (
        <StepSuccess
          listingName={claimState?.listingName ?? listing.name ?? "Votre ferme"}
          listingSlug={finalSlug}
        />
      )}
    </div>
  );
}
