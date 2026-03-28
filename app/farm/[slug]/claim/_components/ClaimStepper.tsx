"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Contact" },
  { label: "SIRET" },
  { label: "Vérification" },
  { label: "Code" },
  { label: "Confirmation" },
];

interface ClaimStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5;
}

export function ClaimStepper({ currentStep }: ClaimStepperProps) {
  return (
    <nav aria-label="Progression revendication" className="w-full">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const stepNum = (i + 1) as 1 | 2 | 3 | 4 | 5;
          const isCompleted = stepNum < currentStep;
          const isActive = stepNum === currentStep;

          return (
            <li key={step.label} className="flex items-center flex-1 last:flex-none">
              {/* Step indicator */}
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                    isCompleted
                      ? "bg-emerald-600 text-white"
                      : isActive
                        ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                        : "bg-gray-100 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <span>{stepNum}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap hidden sm:block",
                    isActive
                      ? "text-emerald-700"
                      : isCompleted
                        ? "text-emerald-600"
                        : "text-gray-400"
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors",
                    stepNum < currentStep ? "bg-emerald-600" : "bg-gray-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
