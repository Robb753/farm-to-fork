"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

interface StepSuccessProps {
  listingName: string;
  listingSlug: string;
}

export function StepSuccess({ listingName, listingSlug }: StepSuccessProps) {
  return (
    <div className="flex flex-col items-center text-center space-y-5 py-4">
      {/* Icône animée */}
      <div
        className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center"
        style={{ animation: "claim-success-pop 0.4s ease-out" }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-10 h-10 text-emerald-600"
          style={{ animation: "claim-check-draw 0.3s ease-out 0.2s both" }}
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>

      <style>{`
        @keyframes claim-success-pop {
          0%   { transform: scale(0.6); opacity: 0; }
          70%  { transform: scale(1.1); }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes claim-check-draw {
          0%   { opacity: 0; transform: scale(0.7); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">
          Revendication réussie !
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Votre fiche{" "}
          <strong className="text-foreground">{listingName}</strong> a bien
          été revendiquée.
          <br />
          Vous êtes maintenant reconnu comme propriétaire.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full pt-2">
        <Button
          asChild
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          <Link href={`/farm/${listingSlug}`}>Voir ma fiche</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/dashboard/farms">Tableau de bord producteur</Link>
        </Button>
      </div>
    </div>
  );
}
