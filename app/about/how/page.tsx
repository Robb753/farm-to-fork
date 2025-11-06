"use client";

import React from "react";
import Link from "next/link";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les cartes explicatives
 */
interface HowCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  features: string[];
  colors: {
    bg: string;
    accent: string;
  };
  cta?: {
    text: string;
    href: string;
  };
}

/**
 * Page "Comment ça marche" de Farm to Fork
 * 
 * Features:
 * - Explication du fonctionnement pour chaque type d'utilisateur
 * - Cartes interactives avec animations
 * - Fonctionnalités à venir
 * - Call-to-action vers l'inscription
 */
export default function How(): JSX.Element {
  /**
   * Configuration des cartes explicatives
   */
  const howCards: HowCard[] = [
    {
      id: "producers",
      emoji: "🌱",
      title: "Pour les Producteurs",
      description: "Chaque ferme peut créer un compte gratuit et obtenir :",
      features: [
        "Un profil personnalisé (photos, présentation, produits)",
        "Indiquer ses points de vente : ferme, marchés, AMAP",
        "Accès au tableau de bord pour mettre à jour ses informations",
        "Validation rapide par notre équipe sous 48h"
      ],
      colors: {
        bg: COLORS.PRIMARY_BG,
        accent: COLORS.PRIMARY,
      },
      cta: {
        text: "Devenir producteur",
        href: PATHS.BECOME_FARMER,
      },
    },
    {
      id: "consumers",
      emoji: "🌍",
      title: "Pour les Consommateurs", 
      description: "Tout visiteur peut :",
      features: [
        "Explorer une carte interactive des fermes proches",
        "Filtrer par type de produits ou mode de distribution",
        "Ajouter ses fermes préférées en favoris",
        "Contacter directement les producteurs pour acheter en circuit court",
        "Créer un compte pour sauvegarder ses préférences"
      ],
      colors: {
        bg: "#fefce8", // yellow-50
        accent: "#ca8a04", // yellow-600
      },
      cta: {
        text: "Explorer les producteurs",
        href: PATHS.LISTINGS,
      },
    },
    {
      id: "future",
      emoji: "✨",
      title: "Fonctionnalités à venir",
      description: "Farm to Fork évolue en continu. Prochainement :",
      features: [
        "Financement participatif pour soutenir les projets agricoles",
        "Badges de durabilité pour valoriser les pratiques écologiques", 
        "Statistiques pour aider les fermes à mieux connaître leur audience",
        "Système de commandes en ligne et click & collect",
        "Application mobile native"
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
        Comment fonctionne Farm to Fork
      </h1>

      {/* ✅ Introduction */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <p 
          className="text-lg mb-6"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Farm to Fork est une plateforme simple, construite autour d'une idée forte :
        </p>
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
          "Mettre en relation directe producteurs locaux et consommateurs engagés"
        </blockquote>
      </div>

      {/* ✅ Cartes explicatives */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        {howCards.map((card, index) => (
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
                className="text-xl font-bold"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {card.title}
              </h2>
            </div>

            {/* Description */}
            <p 
              className="mb-4"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              {card.description}
            </p>

            {/* Liste des fonctionnalités */}
            <ul className="space-y-3 mb-6">
              {card.features.map((feature, featureIndex) => (
                <li 
                  key={featureIndex}
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
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* Call-to-action optionnel */}
            {card.cta && (
              <div className="pt-4 border-t border-opacity-20" style={{ borderColor: card.colors.accent }}>
                <Link 
                  href={card.cta.href}
                  className={cn(
                    "inline-flex items-center justify-center w-full px-4 py-2 rounded-lg",
                    "font-medium text-sm transition-all duration-200",
                    "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2"
                  )}
                  style={{
                    backgroundColor: card.colors.accent,
                    color: COLORS.BG_WHITE,
                  }}
                  onMouseEnter={(e) => {
                    const darkerColor = card.colors.accent === COLORS.PRIMARY 
                      ? COLORS.PRIMARY_DARK 
                      : `${card.colors.accent}dd`;
                    e.currentTarget.style.backgroundColor = darkerColor;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = card.colors.accent;
                  }}
                >
                  {card.cta.text}
                </Link>
              </div>
            )}

            {/* Numéro d'étape */}
            <div className="absolute top-4 right-4">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: card.colors.accent }}
              >
                {index + 1}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ✅ Section processus détaillé */}
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
          🔄 Le processus en 4 étapes simples
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Inscription", desc: "Créez votre compte en 2 minutes", icon: "📝" },
            { step: "2", title: "Profil", desc: "Complétez vos informations", icon: "👤" },
            { step: "3", title: "Validation", desc: "Notre équipe valide sous 48h", icon: "✅" },
            { step: "4", title: "Publication", desc: "Votre ferme est visible sur la carte", icon: "🗺️" },
          ].map((process, index) => (
            <div key={index} className="text-center">
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-white font-bold"
                style={{ backgroundColor: COLORS.PRIMARY }}
              >
                {process.step}
              </div>
              <div className="text-2xl mb-2">{process.icon}</div>
              <h3 
                className="font-semibold mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {process.title}
              </h3>
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {process.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Conclusion avec call-to-action */}
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
            🌱 Un projet vivant et collaboratif
          </h2>
          <p 
            className="text-lg mb-6"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Farm to Fork est un projet vivant : votre retour compte pour
            construire ensemble un réseau alimentaire local plus solide et durable.
          </p>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href={PATHS.BECOME_FARMER}
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
              Devenir producteur
            </Link>
            <Link 
              href={PATHS.CONTACT}
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
              Nous contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}