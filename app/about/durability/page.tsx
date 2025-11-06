"use client";

import React from "react";
import Link from "next/link";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les cartes de durabilité
 */
interface SustainabilityCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  benefits: string[];
  colors: {
    bg: string;
    accent: string;
  };
}

/**
 * Page "Durabilité" de Farm to Fork
 * 
 * Features:
 * - Vision de la durabilité et impact environnemental
 * - Cartes interactives avec bénéfices détaillés
 * - Engagement écologique et social
 * - Call-to-action vers l'action concrète
 */
export default function Durability(): JSX.Element {
  /**
   * Configuration des cartes de durabilité
   */
  const sustainabilityCards: SustainabilityCard[] = [
    {
      id: "connection",
      emoji: "📍",
      title: "Mieux connecter producteurs et consommateurs",
      description: "Farm to Fork rend visible l'offre locale et facilite la découverte de producteurs proches, tout en simplifiant les achats en direct.",
      benefits: [
        "Réduction des intermédiaires",
        "Transparence sur l'origine des produits",
        "Relations directes et de confiance",
        "Support de l'économie locale"
      ],
      colors: {
        bg: COLORS.PRIMARY_BG,
        accent: COLORS.PRIMARY,
      },
    },
    {
      id: "access",
      emoji: "🛒",
      title: "Accès rapide aux circuits courts",
      description: "Les utilisateurs trouvent facilement des produits locaux grâce à des filtres clairs et une carte interactive, sans intermédiaires compliqués.",
      benefits: [
        "Réduction de l'empreinte carbone",
        "Produits plus frais et de saison",
        "Prix équitables pour tous",
        "Diminution des emballages"
      ],
      colors: {
        bg: "#fefce8", // yellow-50
        accent: "#ca8a04", // yellow-600
      },
    },
    {
      id: "tools",
      emoji: "📊",
      title: "Outils simples pour les producteurs",
      description: "Chaque ferme dispose d'un espace pour présenter ses produits, actualiser ses informations et se rendre accessible auprès de nouveaux clients.",
      benefits: [
        "Visibilité accrue sans coût marketing",
        "Autonomie dans la gestion du profil",
        "Accès à de nouveaux marchés locaux",
        "Valorisation du savoir-faire artisanal"
      ],
      colors: {
        bg: "#eff6ff", // blue-50
        accent: "#2563eb", // blue-600
      },
    },
    {
      id: "evolution",
      emoji: "🔧",
      title: "Un projet évolutif",
      description: "Farm to Fork s'adapte aux besoins des producteurs et des utilisateurs, pour construire des solutions pratiques, simples et durables dans le temps.",
      benefits: [
        "Développement basé sur les retours utilisateurs",
        "Technologies respectueuses de l'environnement",
        "Open source et transparent",
        "Gouvernance participative"
      ],
      colors: {
        bg: "#faf5ff", // purple-50
        accent: "#9333ea", // purple-600
      },
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ✅ Fil d'Ariane */}
      <Breadcrumb />

      {/* ✅ Titre principal */}
      <h1 
        className="text-4xl font-bold mb-12 text-center"
        style={{ color: COLORS.TEXT_PRIMARY }}
      >
        Notre Vision de la Durabilité
      </h1>

      {/* ✅ Introduction */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <p 
          className="text-lg mb-6"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Farm to Fork facilite l'accès direct aux producteurs locaux grâce à des
          outils modernes, pour simplifier les échanges et valoriser l'offre locale.
        </p>
        
        {/* Citation mise en valeur */}
        <blockquote 
          className={cn(
            "text-xl italic font-medium p-6 rounded-xl border-l-4"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderLeftColor: COLORS.PRIMARY,
            color: COLORS.PRIMARY_DARK,
          }}
        >
          "La durabilité naît de la simplicité et de la proximité"
        </blockquote>
      </div>

      {/* ✅ Cartes de durabilité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {sustainabilityCards.map((card, index) => (
          <div
            key={card.id}
            className={cn(
              "p-6 rounded-2xl shadow-md transition-all duration-300",
              "hover:shadow-lg hover:-translate-y-1",
              "border border-opacity-20"
            )}
            style={{
              backgroundColor: card.colors.bg,
              borderColor: card.colors.accent,
            }}
          >
            {/* En-tête */}
            <div className="mb-4">
              <div 
                className="text-3xl mb-3"
                role="img"
                aria-label={`Icône pour ${card.title}`}
              >
                {card.emoji}
              </div>
              <h2 
                className="text-xl font-bold mb-3"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {card.title}
              </h2>
            </div>

            {/* Description */}
            <p 
              className="mb-6"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              {card.description}
            </p>

            {/* Bénéfices */}
            <div className="mb-4">
              <h3 
                className="font-semibold mb-3 text-sm uppercase tracking-wide"
                style={{ color: card.colors.accent }}
              >
                Bénéfices concrets
              </h3>
              <ul className="space-y-2">
                {card.benefits.map((benefit, benefitIndex) => (
                  <li 
                    key={benefitIndex}
                    className="flex items-start space-x-3"
                  >
                    <div 
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                      style={{ backgroundColor: card.colors.accent }}
                    />
                    <span 
                      className="text-sm"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Badge de pilier */}
            <div className="pt-4 border-t border-opacity-20" style={{ borderColor: card.colors.accent }}>
              <span 
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  backgroundColor: `${card.colors.accent}20`,
                  color: card.colors.accent,
                }}
              >
                Pilier #{index + 1}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Section impact environnemental */}
      <div 
        className="mb-16 p-8 rounded-2xl border"
        style={{
          backgroundColor: COLORS.BG_GRAY,
          borderColor: COLORS.BORDER,
        }}
      >
        <h2 
          className="text-2xl font-semibold text-center mb-8"
          style={{ color: COLORS.PRIMARY }}
        >
          🌍 Notre impact environnemental
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { 
              metric: "-40%", 
              label: "Émissions CO₂ par achat", 
              desc: "Grâce aux circuits courts",
              icon: "🌱" 
            },
            { 
              metric: "85%", 
              label: "Produits de saison", 
              desc: "En moyenne sur la plateforme",
              icon: "🍅" 
            },
            { 
              metric: "2km", 
              label: "Distance moyenne", 
              desc: "Entre producteur et consommateur",
              icon: "📍" 
            },
          ].map((impact, index) => (
            <div key={index} className="space-y-3">
              <div className="text-3xl">{impact.icon}</div>
              <div 
                className="text-3xl font-bold"
                style={{ color: COLORS.PRIMARY }}
              >
                {impact.metric}
              </div>
              <div 
                className="font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {impact.label}
              </div>
              <div 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {impact.desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Section engagements */}
      <div 
        className="mb-16 p-8 rounded-2xl"
        style={{
          backgroundColor: COLORS.PRIMARY_BG,
          border: `2px solid ${COLORS.PRIMARY}20`,
        }}
      >
        <h2 
          className="text-2xl font-semibold text-center mb-8"
          style={{ color: COLORS.PRIMARY }}
        >
          🤝 Nos engagements durables
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              title: "Transparence totale",
              desc: "Code open source, données ouvertes, gouvernance participative",
              icon: "🔍"
            },
            {
              title: "Inclusion sociale", 
              desc: "Accessibilité pour tous, accompagnement des producteurs",
              icon: "🤗"
            },
            {
              title: "Innovation responsable",
              desc: "Technologies sobres, développement éthique et durable",
              icon: "💡"
            },
            {
              title: "Économie circulaire",
              desc: "Réduction des déchets, valorisation locale, circuits fermés",
              icon: "♻️"
            },
          ].map((commitment, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="text-2xl flex-shrink-0">{commitment.icon}</div>
              <div>
                <h3 
                  className="font-semibold mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {commitment.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {commitment.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Conclusion avec appel à l'action */}
      <div className="text-center max-w-4xl mx-auto">
        <div 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            border: `2px solid ${COLORS.PRIMARY}20`,
          }}
        >
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: COLORS.PRIMARY }}
          >
            🌱 Agissons ensemble pour un avenir durable
          </h2>
          <p 
            className="text-lg mb-6"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Une approche directe et concrète pour soutenir l'économie locale.
            Chaque achat local est un vote pour l'avenir que nous voulons construire.
          </p>

          {/* Boutons d'action */}
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
              Découvrir les producteurs locaux
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
              Rejoindre le mouvement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}