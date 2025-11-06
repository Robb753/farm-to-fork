"use client";

import React from "react";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les cartes de mission
 */
interface MissionCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  features: string[];
  colors: {
    bg: string;
    accent: string;
  };
}

/**
 * Page des missions de Farm to Fork
 * 
 * Features:
 * - Présentation des missions principales
 * - Cartes interactives avec animations
 * - Design responsive et accessible
 * - Configuration centralisée des couleurs
 */
export default function Missions(): JSX.Element {
  /**
   * Configuration des cartes de mission
   */
  const missionCards: MissionCard[] = [
    {
      id: "visibility",
      emoji: "🌱",
      title: "Redonner de la visibilité aux producteurs",
      description: "Trop de fermes restent invisibles, faute d'outils numériques adaptés.",
      features: [
        "Une page dédiée, simple à créer",
        "Une carte interactive pour se faire découvrir",
        "Un espace pour présenter produits et savoir-faire"
      ],
      colors: {
        bg: COLORS.PRIMARY_BG,
        accent: COLORS.PRIMARY,
      },
    },
    {
      id: "accessibility", 
      emoji: "🛒",
      title: "Faciliter l'accès aux circuits courts",
      description: "Le circuit court doit être accessible à tous grâce à Farm to Fork.",
      features: [
        "Trouver des producteurs proches",
        "Filtrer par type de produit et distribution", 
        "Accéder à des initiatives locales durables"
      ],
      colors: {
        bg: "#fefce8", // yellow-50
        accent: "#ca8a04", // yellow-600
      },
    },
    {
      id: "autonomy",
      emoji: "🌾", 
      title: "Soutenir l'autonomie économique des fermes",
      description: "Aider les producteurs à trouver de nouveaux leviers d'indépendance.",
      features: [
        "Mise en avant de projets à soutenir",
        "Financement participatif et tokenisation",
        "Communautés engagées autour des fermes"
      ],
      colors: {
        bg: "#eff6ff", // blue-50
        accent: "#2563eb", // blue-600
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
        Nos Missions
      </h1>

      {/* ✅ Introduction */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <p 
          className="text-lg mb-6"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Chez{" "}
          <strong style={{ color: COLORS.PRIMARY }}>
            Farm to Fork
          </strong>
          , notre mission est simple :
        </p>
        <blockquote 
          className={cn(
            "text-xl italic font-medium p-6 rounded-xl border-l-4",
            "bg-opacity-50"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderLeftColor: COLORS.PRIMARY,
            color: COLORS.PRIMARY_DARK,
          }}
        >
          "Reconnecter producteurs et consommateurs avec des outils modernes et
          accessibles."
        </blockquote>
      </div>

      {/* ✅ Cartes de missions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        {missionCards.map((mission, index) => (
          <div
            key={mission.id}
            className={cn(
              "p-6 rounded-2xl shadow-md transition-all duration-300",
              "hover:shadow-lg hover:-translate-y-1",
              "border border-opacity-20"
            )}
            style={{
              backgroundColor: mission.colors.bg,
              borderColor: mission.colors.accent,
            }}
          >
            {/* En-tête avec emoji et titre */}
            <div className="mb-4">
              <div 
                className="text-3xl mb-3"
                role="img"
                aria-label={`Icône pour ${mission.title}`}
              >
                {mission.emoji}
              </div>
              <h2 
                className="text-xl font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {mission.title}
              </h2>
            </div>

            {/* Description */}
            <p 
              className="mb-4"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              {mission.description}
            </p>

            {/* Liste des fonctionnalités */}
            <ul className="space-y-2">
              {mission.features.map((feature, featureIndex) => (
                <li 
                  key={featureIndex}
                  className="flex items-start space-x-3"
                >
                  <div 
                    className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
                    style={{ backgroundColor: mission.colors.accent }}
                  />
                  <span style={{ color: COLORS.TEXT_SECONDARY }}>
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* Indicateur de priorité */}
            <div className="mt-4 pt-4 border-t border-opacity-20" style={{ borderColor: mission.colors.accent }}>
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm font-medium"
                  style={{ color: mission.colors.accent }}
                >
                  Mission #{index + 1}
                </span>
                <div 
                  className="w-8 h-1 rounded-full"
                  style={{ backgroundColor: mission.colors.accent }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Section impact et statistiques */}
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
          📊 Notre impact en quelques chiffres
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          {[
            { number: "500+", label: "Producteurs référencés", icon: "👨‍🌾" },
            { number: "10k+", label: "Consommateurs actifs", icon: "🛒" },
            { number: "85%", label: "Satisfaction utilisateurs", icon: "⭐" },
          ].map((stat, index) => (
            <div key={index} className="space-y-2">
              <div className="text-2xl">{stat.icon}</div>
              <div 
                className="text-3xl font-bold"
                style={{ color: COLORS.PRIMARY }}
              >
                {stat.number}
              </div>
              <div 
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Conclusion enrichie */}
      <div className="text-center max-w-4xl mx-auto">
        <div 
          className="p-8 rounded-2xl"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            border: `2px solid ${COLORS.PRIMARY}20`,
          }}
        >
          <h2 
            className="text-3xl font-semibold mb-6"
            style={{ color: COLORS.PRIMARY }}
          >
            🌍 Un projet humain, durable et ambitieux
          </h2>
          <p 
            className="text-lg mb-6"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Chaque ferme compte. Chaque geste d'achat local compte. Farm to Fork
            est une invitation à construire ensemble un modèle alimentaire plus
            juste, plus humain et plus durable.
          </p>

          {/* Valeurs clés */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { icon: "🤝", label: "Transparence", desc: "Relations directes et honnêtes" },
              { icon: "🌱", label: "Durabilité", desc: "Respect de l'environnement" },
              { icon: "💚", label: "Solidarité", desc: "Soutien mutuel et entraide" },
            ].map((value, index) => (
              <div key={index} className="text-center p-4">
                <div className="text-2xl mb-2">{value.icon}</div>
                <div 
                  className="font-semibold mb-1"
                  style={{ color: COLORS.PRIMARY }}
                >
                  {value.label}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_MUTED }}
                >
                  {value.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}