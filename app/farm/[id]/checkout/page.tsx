// app/farm/[id]/checkout/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { COLORS } from "@/lib/config";

/**
 * Page de paiement (checkout)
 * Route: /farm/[id]/checkout
 *
 * TODO: Implémenter l'intégration Stripe ou autre solution de paiement
 */
export default function FarmCheckoutPage(): JSX.Element {
  const params = useParams();
  const farmId = params.id as string;

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <Link
          href={`/farm/${farmId}/cart`}
          className="inline-flex items-center gap-2 mb-6 text-sm hover:underline"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au panier
        </Link>

        {/* En-tête */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Finaliser ma commande
          </h1>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Vérifiez vos informations et procédez au paiement
          </p>
        </div>

        {/* Contenu temporaire */}
        <div
          className="p-8 rounded-2xl text-center border-2"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <ShoppingCart
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: COLORS.PRIMARY }}
          />
          <h2
            className="text-2xl font-bold mb-4"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Page de paiement en construction
          </h2>
          <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            L'intégration du système de paiement est en cours de développement.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/farm/${farmId}/cart`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium border-2"
              style={{
                borderColor: COLORS.PRIMARY,
                color: COLORS.PRIMARY,
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              Retour au panier
            </Link>

            <Link
              href={`/farm/${farmId}/shop`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium"
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Continuer mes achats
            </Link>
          </div>
        </div>

        {/* TODO: Ajouter ici */}
        {/* - Récapitulatif de la commande */}
        {/* - Formulaire d'adresse de livraison */}
        {/* - Choix du mode de retrait/livraison */}
        {/* - Intégration Stripe Elements */}
        {/* - Validation et création de la commande */}
      </div>
    </div>
  );
}
