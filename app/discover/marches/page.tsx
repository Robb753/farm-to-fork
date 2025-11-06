"use client";

import React from "react";
import Link from "next/link";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS, PURCHASE_MODES } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les types de marchés
 */
interface MarketType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  count: string;
  features: string[];
  color: string;
}

/**
 * Page des marchés partenaires
 * 
 * Features:
 * - Présentation des types de marchés disponibles
 * - État de construction avec message informatif
 * - Aperçu des fonctionnalités par type de marché
 * - Design responsive et accessible
 */
export default function MarchesPage(): JSX.Element {
  /**
   * Configuration des types de marchés
   */
  const marketTypes: MarketType[] = [
    {
      id: "traditionnels",
      name: "Marchés traditionnels",
      emoji: "🏪",
      description: "Marchés hebdomadaires avec producteurs locaux",
      count: "85+",
      features: ["Produits frais", "Contact direct", "Ambiance conviviale"],
      color: "#2563eb", // blue-600
    },
    {
      id: "fermiers",
      name: "Marchés fermiers",
      emoji: "🚜",
      description: "Marchés exclusivement dédiés aux producteurs",
      count: "45+",
      features: ["100% producteurs", "Circuits ultra-courts", "Qualité garantie"],
      color: COLORS.PRIMARY,
    },
    {
      id: "drive",
      name: "Drive fermier",
      emoji: "🚗",
      description: "Points de retrait pour commandes en ligne",
      count: "30+",
      features: ["Commande web", "Retrait rapide", "Horaires flexibles"],
      color: "#9333ea", // purple-600
    },
    {
      id: "collectifs",
      name: "Points de vente collectifs",
      emoji: "🏬",
      description: "Magasins collaboratifs de producteurs",
      count: "25+",
      features: ["Plusieurs producteurs", "Ouvert toute la semaine", "Large choix"],
      color: "#ea580c", // orange-600
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ✅ Fil d'Ariane (visible seulement sur md+) */}
      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      {/* ✅ Carte principale avec design amélioré */}
      <div 
        className="p-8 rounded-2xl shadow-md mb-12"
        style={{
          backgroundColor: "#eff6ff", // blue-50
          border: `2px solid #2563eb20`, // blue-600 avec opacité
        }}
      >
        <h1 
          className="text-4xl font-bold mb-6 text-center"
          style={{ color: "#1d4ed8" }} // blue-700
        >
          Nos Marchés Partenaires
        </h1>

        <p 
          className="text-lg text-center mb-8 max-w-3xl mx-auto"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Retrouvez les marchés partenaires pour acheter directement aux
          producteurs locaux, découvrir les spécialités régionales et soutenir
          l'économie de proximité.
        </p>

        {/* ✅ Message d'état avec design amélioré */}
        <div className="flex justify-center mb-8">
          <div 
            className="p-6 rounded-xl shadow-inner max-w-xl border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: "#2563eb30",
            }}
          >
            <p 
              className="text-center"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              🛒 <strong>Répertoire en construction</strong>
              <br />
              La carte des marchés sera disponible bientôt !
              <br />
              <span className="text-sm">
                Découvrez dès maintenant nos producteurs et leurs points de vente.
              </span>
            </p>
          </div>
        </div>

        {/* ✅ Bouton vers la carte */}
        <div className="text-center">
          <Link 
            href={PATHS.LISTINGS}
            className={cn(
              "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold",
              "transition-all duration-200 hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            )}
            style={{
              backgroundColor: "#2563eb", // blue-600
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#1d4ed8"; // blue-700
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#2563eb"; // blue-600
            }}
          >
            Explorer les points de vente
          </Link>
        </div>
      </div>

      {/* ✅ Types de marchés */}
      <div className="mb-12">
        <h2 
          className="text-2xl font-semibold text-center mb-8"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          🗺️ Types de points de vente référencés
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {marketTypes.map((type) => (
            <div
              key={type.id}
              className={cn(
                "p-6 rounded-lg border-2 border-dashed transition-all duration-300",
                "hover:border-solid hover:shadow-md"
              )}
              style={{
                borderColor: `${type.color}40`,
                backgroundColor: `${type.color}05`,
              }}
            >
              <div>
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-3xl flex-shrink-0">{type.emoji}</div>
                  <div className="flex-1">
                    <h3 
                      className="font-semibold mb-2"
                      style={{ color: type.color }}
                    >
                      {type.name}
                    </h3>
                    <p 
                      className="text-sm mb-3"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {type.description}
                    </p>
                  </div>
                </div>
                
                {/* Caractéristiques */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {type.features.map((feature, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: `${type.color}20`,
                          color: type.color,
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Compteur */}
                <div 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${type.color}20`,
                    color: type.color,
                  }}
                >
                  {type.count} points prévus
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Section modes d'achat */}
      <div 
        className="p-8 rounded-2xl border mb-12"
        style={{
          backgroundColor: COLORS.BG_GRAY,
          borderColor: COLORS.BORDER,
        }}
      >
        <h2 
          className="text-2xl font-semibold text-center mb-8"
          style={{ color: COLORS.PRIMARY }}
        >
          🛍️ Modes d'achat disponibles
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PURCHASE_MODES.map((mode, index) => (
            <div 
              key={index} 
              className="flex items-center space-x-3 p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <div 
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: COLORS.PRIMARY }}
              />
              <span 
                className="text-sm font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                {mode}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Section avantages des marchés locaux */}
      <div 
        className="p-8 rounded-2xl border mb-12"
        style={{
          backgroundColor: "#eff6ff", // blue-50
          borderColor: "#2563eb20",
        }}
      >
        <h2 
          className="text-2xl font-semibold text-center mb-8"
          style={{ color: "#2563eb" }}
        >
          💡 Pourquoi acheter sur les marchés locaux ?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: "🌱",
              title: "Fraîcheur garantie",
              description: "Produits récoltés le matin même, sans longs transports"
            },
            {
              icon: "🤝",
              title: "Relation directe",
              description: "Échangez avec vos producteurs, découvrez leurs méthodes"
            },
            {
              icon: "🌍",
              title: "Impact local",
              description: "Soutenez l'économie locale et réduisez l'empreinte carbone"
            },
            {
              icon: "💰",
              title: "Prix justes",
              description: "Rémunération équitable sans intermédiaires multiples"
            },
          ].map((benefit, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="text-2xl flex-shrink-0">{benefit.icon}</div>
              <div>
                <h3 
                  className="font-semibold mb-1"
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
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Call-to-action pour organiser un marché */}
      <div 
        className="p-8 rounded-2xl text-center"
        style={{
          backgroundColor: COLORS.PRIMARY_BG,
          border: `2px solid ${COLORS.PRIMARY}20`,
        }}
      >
        <h2 
          className="text-2xl font-semibold mb-4"
          style={{ color: COLORS.PRIMARY }}
        >
          📍 Vous organisez un marché ?
        </h2>
        <p 
          className="text-lg mb-6 max-w-2xl mx-auto"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Référencez votre marché sur notre plateforme pour donner plus de 
          visibilité à vos producteurs et attirer de nouveaux visiteurs.
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
          >
            Référencer mon marché
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
            Devenir producteur
          </Link>
        </div>
      </div>
    </div>
  );
}