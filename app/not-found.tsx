"use client";

import Link from "next/link";
import { Ghost } from "@/utils/icons";
import React from "react";
import { cn } from "@/lib/utils";
import { COLORS, PATHS } from "@/lib/config";

/**
 * Page 404 - Page non trouvée
 * 
 * Features:
 * - Design centré et amical avec icône fantôme
 * - Message d'erreur contextualisé à l'agriculture
 * - Navigation de retour vers l'accueil
 * - Configuration centralisée des couleurs
 */
export default function NotFound(): JSX.Element {
  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen px-6"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      {/* ✅ Icône fantôme avec animation */}
      <div className="mb-6 md:mb-8 animate-bounce">
        <Ghost 
          className="w-24 h-24" 
          style={{ color: COLORS.PRIMARY_DARK }}
          aria-hidden="true"
        />
      </div>

      {/* ✅ Titre principal */}
      <h1 
        className="text-3xl md:text-5xl font-bold mb-4 text-center"
        style={{ color: COLORS.PRIMARY_DARK }}
      >
        Oups, page introuvable !
      </h1>

      {/* ✅ Sous-titre avec contexte agricole */}
      <div className="text-center max-w-md mb-8">
        <p 
          className="text-md md:text-lg mb-4"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Il semble que vous soyez perdu entre les fermes 🌾.
        </p>
        <p 
          className="text-sm"
          style={{ color: COLORS.TEXT_MUTED }}
        >
          Pas de souci, nous allons vous remettre sur le bon chemin vers nos producteurs locaux.
        </p>
      </div>

      {/* ✅ Suggestions de navigation */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <Link
          href={PATHS.HOME}
          className={cn(
            "px-6 py-3 rounded-full font-semibold text-sm md:text-lg",
            "transition-all duration-200 hover:shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY_DARK,
            color: COLORS.BG_WHITE,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
          }}
        >
          🏠 Revenir à l'accueil
        </Link>

        <Link
          href={PATHS.LISTINGS}
          className={cn(
            "px-6 py-3 rounded-full font-semibold text-sm md:text-lg",
            "border-2 transition-all duration-200 hover:shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          )}
          style={{
            borderColor: COLORS.PRIMARY,
            color: COLORS.PRIMARY,
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          🗺️ Voir la carte
        </Link>
      </div>

      {/* ✅ Liens rapides */}
      <div className="text-center">
        <p 
          className="text-sm mb-4 font-medium"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Ou explorez directement :
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "Producteurs", href: "/discover/producteurs", emoji: "🚜" },
            { label: "Produits", href: "/discover/produits", emoji: "🥕" },
            { label: "Marchés", href: "/discover/marches", emoji: "🏪" },
            { label: "Événements", href: "/events", emoji: "📅" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center space-x-1 px-3 py-2 rounded-full text-sm font-medium",
                "border transition-colors duration-200",
                "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              )}
              style={{
                borderColor: COLORS.BORDER,
                color: COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
                e.currentTarget.style.borderColor = COLORS.PRIMARY;
                e.currentTarget.style.color = COLORS.PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.BORDER;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              <span>{link.emoji}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ✅ Section d'aide */}
      <div 
        className="mt-12 p-6 rounded-lg border max-w-md text-center"
        style={{
          backgroundColor: COLORS.BG_WHITE,
          borderColor: COLORS.BORDER,
        }}
      >
        <h3 
          className="font-semibold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          🤔 Besoin d'aide ?
        </h3>
        <p 
          className="text-sm mb-4"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Si vous cherchiez quelque chose de spécifique, n'hésitez pas à nous contacter.
        </p>
        <Link
          href={PATHS.CONTACT}
          className={cn(
            "inline-flex items-center space-x-1 text-sm font-medium",
            "hover:underline transition-colors duration-200",
            "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
          )}
          style={{ color: COLORS.PRIMARY }}
        >
          <span>💬</span>
          <span>Nous contacter</span>
        </Link>
      </div>
    </div>
  );
}