"use client";

import React from "react";
import Link from "next/link";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS, PRODUCT_TYPES } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les catégories de produits
 */
interface ProductCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  count: string;
  color: string;
}

/**
 * Page des produits fermiers
 * 
 * Features:
 * - Présentation des catégories de produits disponibles
 * - État de construction avec message informatif
 * - Aperçu des futures fonctionnalités
 * - Design responsive et accessible
 */
export default function ProduitsPage(): JSX.Element {
  /**
   * Configuration des catégories de produits
   */
  const productCategories: ProductCategory[] = [
    {
      id: "fruits",
      name: PRODUCT_TYPES[0], // "Fruits"
      emoji: "🍎",
      description: "Pommes, poires, fruits rouges de saison",
      count: "120+",
      color: "#dc2626", // red-600
    },
    {
      id: "legumes",
      name: PRODUCT_TYPES[1], // "Légumes"
      emoji: "🥕",
      description: "Légumes frais, racines, légumes verts",
      count: "200+",
      color: "#16a34a", // green-600
    },
    {
      id: "laitiers",
      name: PRODUCT_TYPES[2], // "Produits laitiers"
      emoji: "🧀",
      description: "Fromages, lait frais, yaourts fermiers",
      count: "80+",
      color: "#ca8a04", // yellow-600
    },
    {
      id: "viande",
      name: PRODUCT_TYPES[3], // "Viande"
      emoji: "🥩",
      description: "Bœuf, porc, agneau d'élevage local",
      count: "60+",
      color: "#dc2626", // red-600
    },
    {
      id: "oeufs",
      name: PRODUCT_TYPES[4], // "Œufs"
      emoji: "🥚",
      description: "Œufs frais de poules élevées au sol",
      count: "40+",
      color: "#f59e0b", // amber-500
    },
    {
      id: "transformes",
      name: PRODUCT_TYPES[5], // "Produits transformés"
      emoji: "🍯",
      description: "Miel, confitures, conserves artisanales",
      count: "150+",
      color: "#9333ea", // purple-600
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* ✅ Fil d'Ariane (visible seulement sur md+) */}
      <div className="hidden md:block">
        <Breadcrumb />
      </div>

      {/* ✅ Carte principale avec amélioration du design */}
      <div 
        className="p-8 rounded-2xl shadow-md mb-12"
        style={{
          backgroundColor: "#fefce8", // yellow-50
          border: `2px solid #ca8a0420`, // yellow-600 avec opacité
        }}
      >
        <h1 
          className="text-4xl font-bold mb-6 text-center"
          style={{ color: "#a16207" }} // yellow-700
        >
          Nos Produits Fermiers
        </h1>

        <p 
          className="text-lg text-center mb-8 max-w-3xl mx-auto"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Fruits, légumes, viandes, produits laitiers, et bien plus encore. Farm
          To Fork sélectionne pour vous les meilleurs produits fermiers issus de
          circuits courts et de l'agriculture locale.
        </p>

        {/* ✅ Message d'état avec design amélioré */}
        <div className="flex justify-center mb-8">
          <div 
            className="p-6 rounded-xl shadow-inner max-w-xl border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: "#ca8a0430",
            }}
          >
            <p 
              className="text-center"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              🥕 <strong>Catalogue en construction</strong>
              <br />
              La sélection détaillée de produits sera disponible prochainement !
              <br />
              <span className="text-sm">
                En attendant, découvrez nos producteurs et leurs spécialités.
              </span>
            </p>
          </div>
        </div>

        {/* ✅ Bouton vers les producteurs */}
        <div className="text-center">
          <Link 
            href={PATHS.LISTINGS}
            className={cn(
              "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold",
              "transition-all duration-200 hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            )}
            style={{
              backgroundColor: "#ca8a04", // yellow-600
              color: COLORS.BG_WHITE,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#a16207"; // yellow-700
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#ca8a04"; // yellow-600
            }}
          >
            Découvrir nos producteurs
          </Link>
        </div>
      </div>

      {/* ✅ Aperçu des catégories à venir */}
      <div className="mb-12">
        <h2 
          className="text-2xl font-semibold text-center mb-8"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          🌱 Catégories de produits à découvrir
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {productCategories.map((category) => (
            <div
              key={category.id}
              className={cn(
                "p-6 rounded-lg border-2 border-dashed transition-all duration-300",
                "hover:border-solid hover:shadow-md"
              )}
              style={{
                borderColor: `${category.color}40`,
                backgroundColor: `${category.color}05`,
              }}
            >
              <div className="text-center">
                <div className="text-3xl mb-3">{category.emoji}</div>
                <h3 
                  className="font-semibold mb-2"
                  style={{ color: category.color }}
                >
                  {category.name}
                </h3>
                <p 
                  className="text-sm mb-3"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {category.description}
                </p>
                <div 
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                  }}
                >
                  {category.count} variétés prévues
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Section fonctionnalités à venir */}
      <div 
        className="p-8 rounded-2xl border"
        style={{
          backgroundColor: COLORS.BG_GRAY,
          borderColor: COLORS.BORDER,
        }}
      >
        <h2 
          className="text-2xl font-semibold text-center mb-6"
          style={{ color: COLORS.PRIMARY }}
        >
          🚀 Fonctionnalités à venir
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: "🔍",
              title: "Recherche avancée",
              description: "Filtres par saison, certification, mode de production"
            },
            {
              icon: "📅",
              title: "Disponibilité saisonnière",
              description: "Calendrier des produits selon les saisons"
            },
            {
              icon: "⭐",
              title: "Avis et notes",
              description: "Évaluations des consommateurs sur les produits"
            },
            {
              icon: "📦",
              title: "Commandes en ligne",
              description: "Réservation et achat direct depuis la plateforme"
            },
          ].map((feature, index) => (
            <div key={index} className="flex items-start space-x-4">
              <div className="text-2xl flex-shrink-0">{feature.icon}</div>
              <div>
                <h3 
                  className="font-semibold mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {feature.title}
                </h3>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Call-to-action */}
        <div className="text-center mt-8">
          <p 
            className="mb-4"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Intéressé par ces fonctionnalités ? Restez informé de nos nouveautés !
          </p>
          <Link 
            href={PATHS.CONTACT}
            className={cn(
              "inline-flex items-center justify-center px-6 py-2 rounded-lg font-medium",
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
  );
}