import type { Metadata } from "next";
import Link from "next/link";
import { Wheat, ShoppingBasket, MapPinned } from "@/utils/icons";
import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Découvrir les saveurs locales | Farm to Fork",
  description:
    "Explorez l'univers des producteurs locaux : fermes, produits fermiers et marchés en circuits courts partout en France.",
  openGraph: {
    title: "Découvrir les saveurs locales | Farm to Fork",
    description:
      "Producteurs, produits fermiers et marchés locaux — circuits courts, agriculture durable.",
    type: "website",
  },
};

/**
 * Interface pour les cartes de découverte
 */
interface DiscoverCard {
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
  stats?: {
    count: string;
    label: string;
  };
}

/**
 * Page d'accueil "Découvrir" avec navigation vers les sous-sections
 * 
 * Features:
 * - Navigation par cartes vers les différentes sections de découverte
 * - Design responsive avec animations
 * - Statistiques pour chaque catégorie
 * - Configuration centralisée des couleurs
 */
export default function DiscoverLandingPage(): JSX.Element {
  /**
   * Configuration des cartes de découverte
   */
  const discoverCards: DiscoverCard[] = [
    {
      id: "producers",
      title: "Producteurs",
      description: "Rencontrez les producteurs locaux engagés dans une agriculture authentique et durable.",
      href: "/discover/producteurs",
      icon: Wheat,
      colors: {
        bg: COLORS.PRIMARY_BG,
        text: COLORS.PRIMARY,
        icon: COLORS.PRIMARY_DARK,
      },
      stats: {
        count: "500+",
        label: "producteurs référencés",
      },
    },
    {
      id: "products",
      title: "Produits",
      description: "Découvrez une sélection de produits fermiers issus des circuits courts et de saison.",
      href: "/discover/produits",
      icon: ShoppingBasket,
      colors: {
        bg: "#fefce8", // yellow-50
        text: "#ca8a04", // yellow-600
        icon: "#a16207", // yellow-700
      },
      stats: {
        count: "2000+",
        label: "produits disponibles",
      },
    },
    {
      id: "markets",
      title: "Marchés",
      description: "Parcourez les marchés partenaires pour acheter en direct et soutenir l'économie locale.",
      href: "/discover/marches",
      icon: MapPinned,
      colors: {
        bg: "#eff6ff", // blue-50
        text: "#2563eb", // blue-600
        icon: "#1d4ed8", // blue-700
      },
      stats: {
        count: "150+",
        label: "points de vente",
      },
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* ✅ Fil d'Ariane */}
      <Breadcrumb />

      {/* ✅ En-tête avec titre et description */}
      <div className="text-center mb-12">
        <h1 
          className="text-4xl font-bold mb-6"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Découvrir les Saveurs Locales
        </h1>
        <p 
          className="text-lg max-w-3xl mx-auto"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Explorez l'univers des producteurs locaux, découvrez leurs produits authentiques 
          et trouvez les meilleurs points de vente près de chez vous.
        </p>
      </div>

      {/* ✅ Grille de cartes principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {discoverCards.map((card) => {
          const IconComponent = card.icon;
          
          return (
            <Link 
              key={card.id}
              href={card.href} 
              className="group focus:outline-none focus:ring-2 focus:ring-offset-4 focus:ring-green-500 rounded-2xl"
              aria-label={`Découvrir ${card.title.toLowerCase()}`}
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
                  borderColor: card.colors.text,
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
                <p 
                  className="mb-4"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {card.description}
                </p>

                {/* Statistiques */}
                {card.stats && (
                  <div 
                    className="mt-4 p-3 rounded-lg border border-opacity-30"
                    style={{
                      backgroundColor: `${card.colors.text}10`,
                      borderColor: card.colors.text,
                    }}
                  >
                    <div 
                      className="text-xl font-bold"
                      style={{ color: card.colors.text }}
                    >
                      {card.stats.count}
                    </div>
                    <div 
                      className="text-sm"
                      style={{ color: COLORS.TEXT_MUTED }}
                    >
                      {card.stats.label}
                    </div>
                  </div>
                )}

                {/* Indicateur de lien */}
                <div 
                  className={cn(
                    "mt-4 text-sm font-medium opacity-0 transition-opacity duration-300",
                    "group-hover:opacity-100 flex items-center"
                  )}
                  style={{ color: card.colors.text }}
                >
                  Explorer →
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* ✅ Section de présentation enrichie */}
      <div 
        className="p-8 rounded-2xl border mb-12"
        style={{
          backgroundColor: COLORS.BG_GRAY,
          borderColor: COLORS.BORDER,
        }}
      >
        <div className="text-center mb-8">
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.PRIMARY }}
          >
            🌱 Pourquoi choisir les produits locaux ?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: "🌍",
              title: "Impact environnemental",
              description: "Réduisez votre empreinte carbone en privilégiant les circuits courts"
            },
            {
              icon: "💚", 
              title: "Qualité supérieure",
              description: "Produits frais, de saison, récoltés à maturité par des passionnés"
            },
            {
              icon: "🤝",
              title: "Solidarité locale",
              description: "Soutenez directement les producteurs de votre région"
            },
          ].map((benefit, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl mb-3">{benefit.icon}</div>
              <h3 
                className="font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {benefit.title}
              </h3>
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Section call-to-action */}
      <div className="text-center">
        <div 
          className="max-w-2xl mx-auto p-8 rounded-2xl"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            border: `2px solid ${COLORS.PRIMARY}20`,
          }}
        >
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.PRIMARY }}
          >
            🗺️ Explorez votre région
          </h2>
          <p 
            className="text-lg mb-6"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Utilisez notre carte interactive pour découvrir tous les producteurs 
            et points de vente près de chez vous.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={PATHS.LISTINGS}
              className={cn(
                "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold",
                "transition-all duration-200 hover:shadow-md",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              )}
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              Voir la carte interactive
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
            >
              Devenir producteur partenaire
            </Link>
          </div>
        </div>
      </div>

      {/* ✅ Navigation rapide */}
      <div className="mt-12 text-center">
        <h3 
          className="text-lg font-medium mb-4"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Accès rapide
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { label: "Accueil", href: PATHS.HOME },
            { label: "À propos", href: "/about" },
            { label: "Comment ça marche", href: "/about/how" },
            { label: "Contact", href: PATHS.CONTACT },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium",
                "border transition-colors duration-200",
                "hover:shadow-sm hover:border-green-600 hover:text-green-600 hover:bg-green-50",
                "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              )}
              style={{
                borderColor: COLORS.BORDER,
                color: COLORS.TEXT_SECONDARY,
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