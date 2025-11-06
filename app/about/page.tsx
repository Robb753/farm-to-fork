"use client";

import Link from "next/link";
import { Target, Handshake, Leaf } from "@/utils/icons";
import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les cartes de la page About
 */
interface AboutCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  colors: {
    bg: string;
    text: string;
    icon: string;
  };
}

/**
 * Page d'accueil "À propos" avec navigation vers les sous-sections
 *
 * Features:
 * - Navigation par cartes vers les différentes sections
 * - Design responsive avec animations
 * - Fil d'Ariane pour la navigation
 * - Configuration centralisée des couleurs
 */
export default function AboutLandingPage(): JSX.Element {
  /**
   * Configuration des cartes About
   */
  const aboutCards: AboutCard[] = [
    {
      id: "missions",
      title: "Notre Mission",
      description:
        "Découvrez pourquoi nous avons créé Farm To Fork et ce que nous défendons.",
      href: "/about/missions",
      icon: Target,
      colors: {
        bg: COLORS.PRIMARY_BG,
        text: COLORS.PRIMARY,
        icon: COLORS.PRIMARY_DARK,
      },
    },
    {
      id: "how",
      title: "Comment ça marche",
      description:
        "Comprenez comment la plateforme relie producteurs et consommateurs.",
      href: "/about/how",
      icon: Handshake,
      colors: {
        bg: "#fefce8", // yellow-50 equivalent
        text: "#ca8a04", // yellow-600 equivalent
        icon: "#a16207", // yellow-700 equivalent
      },
    },
    {
      id: "durability",
      title: "Durabilité",
      description:
        "Notre engagement pour un modèle alimentaire local et responsable.",
      href: "/about/durability",
      icon: Leaf,
      colors: {
        bg: "#eff6ff", // blue-50 equivalent
        text: "#2563eb", // blue-600 equivalent
        icon: "#1d4ed8", // blue-700 equivalent
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ✅ Fil d'Ariane */}
      <Breadcrumb />

      {/* ✅ Titre principal */}
      <h1
        className="text-4xl font-bold text-center mb-12"
        style={{ color: COLORS.TEXT_PRIMARY }}
      >
        À Propos de Farm To Fork
      </h1>

      {/* ✅ Grille de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {aboutCards.map((card) => {
          const IconComponent = card.icon;

          return (
            <Link
              key={card.id}
              href={card.href}
              className="group focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-green-500 rounded-2xl"
              aria-label={`En savoir plus sur ${card.title.toLowerCase()}`}
            >
              <div
                className={cn(
                  "p-8 rounded-2xl shadow-md transition-all duration-300",
                  "hover:shadow-lg hover:-translate-y-1",
                  "flex flex-col items-center text-center cursor-pointer",
                  "border border-transparent hover:border-opacity-20"
                )}
                style={{
                  backgroundColor: card.colors.bg,
                  borderColor: `${card.colors.text}20`, // 12.5% opacity
                }}
              >
                {/* Icône */}
                <IconComponent
                  className={cn(
                    "h-12 w-12 mb-4 transition-transform duration-300",
                    "group-hover:scale-110"
                  )}
                  style={{ color: card.colors.icon }}
                  aria-hidden="true"
                />

                {/* Titre */}
                <h2
                  className="text-2xl font-semibold mb-2"
                  style={{ color: card.colors.text }}
                >
                  {card.title}
                </h2>

                {/* Description */}
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  {card.description}
                </p>

                {/* Indicateur de lien */}
                <div
                  className={cn(
                    "mt-4 text-sm font-medium opacity-0 transition-opacity duration-300",
                    "group-hover:opacity-100"
                  )}
                  style={{ color: card.colors.text }}
                >
                  En savoir plus →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ✅ Section informative supplémentaire */}
      <div className="mt-16 text-center">
        <div
          className="max-w-3xl mx-auto p-8 rounded-2xl border"
          style={{
            backgroundColor: COLORS.BG_GRAY,
            borderColor: COLORS.BORDER,
          }}
        >
          <h2
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.PRIMARY }}
          >
            Une questions sur Farm To Fork ?
          </h2>
          <p className="text-lg mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            Notre équipe est là pour vous aider et répondre à toutes vos
            questions sur notre plateforme et notre mission.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={PATHS.CONTACT}
              className={cn(
                "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold",
                "transition-all duration-200 hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              )}
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
              }}
            >
              Nous contacter
            </Link>
            <Link
              href={PATHS.BECOME_FARMER}
              className={cn(
                "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold",
                "border-2 transition-all duration-200 hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              )}
              style={{
                borderColor: COLORS.PRIMARY,
                color: COLORS.PRIMARY,
                backgroundColor: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                e.currentTarget.style.color = COLORS.BG_WHITE;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.PRIMARY;
              }}
            >
              Devenir producteur
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ Section de navigation rapide */}
      <div className="mt-12">
        <div className="text-center mb-6">
          <h3
            className="text-lg font-medium"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Navigation rapide
          </h3>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { label: "Accueil", href: PATHS.HOME },
            { label: "Producteurs", href: PATHS.LISTINGS },
            { label: "Tableau de bord", href: PATHS.DASHBOARD },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium",
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
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
