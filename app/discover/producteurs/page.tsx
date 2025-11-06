"use client";

import React from "react";
import Link from "next/link";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS, PRODUCTION_METHODS, CERTIFICATIONS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les types de producteurs
 */
interface ProducerType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  count: string;
  specialties: string[];
  color: string;
}

/**
 * Page des producteurs partenaires
 * 
 * Features:
 * - Présentation des types de producteurs disponibles
 * - État de construction avec message informatif
 * - Aperçu des spécialités par type de ferme
 * - Design responsive et accessible
 */
export default function ProducteursPage(): JSX.Element {
  /**
   * Configuration des types de producteurs
   */
  const producerTypes: ProducerType[] = [
    {
      id: "maraichage",
      name: "Maraîchage",
      emoji: "🥬",
      description: "Fermes spécialisées dans les légumes frais et de saison",
      count: "180+",
      specialties: ["Légumes bio", "Aromates", "Légumes anciens"],
      color: COLORS.PRIMARY,
    },
    {
      id: "elevage",
      name: "Élevage",
      emoji: "🐄",
      description: "Éleveurs proposant viandes et produits laitiers",
      count: "120+",
      specialties: ["Viande locale", "Fromages fermiers", "Œufs plein air"],
      color: "#dc2626", // red-600
    },
    {
      id: "arboriculture",
      name: "Arboriculture",
      emoji: "🍎",
      description: "Producteurs de fruits et vergers traditionnels",
      count: "95+",
      specialties: ["Fruits de saison", "Jus artisanaux", "Fruits secs"],
      color: "#ea580c", // orange-600
    },
    {
      id: "apiculture",
      name: "Apiculture",
      emoji: "🍯",
      description: "Apiculteurs et producteurs de miel artisanal",
      count: "60+",
      specialties: ["Miels floraux", "Produits de la ruche", "Cire d'abeille"],
      color: "#f59e0b", // amber-500
    },
    {
      id: "transformation",
      name: "Transformation",
      emoji: "🏭",
      description: "Artisans transformateurs de produits fermiers",
      count: "45+",
      specialties: ["Conserves", "Charcuterie", "Pains artisanaux"],
      color: "#9333ea", // purple-600
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
          backgroundColor: COLORS.PRIMARY_BG,
          border: `2px solid ${COLORS.PRIMARY}20`,
        }}
      >
        <h1 
          className="text-4xl font-bold mb-6 text-center"
          style={{ color: COLORS.PRIMARY_DARK }}
        >
          Nos Producteurs Partenaires
        </h1>

        <p 
          className="text-lg text-center mb-8 max-w-3xl mx-auto"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Découvrez les fermes et producteurs partenaires à travers la France et
          l'Europe. Chaque producteur propose des produits authentiques, issus
          d'un savoir-faire local et d'une agriculture respectueuse.
        </p>

        {/* ✅ Message d'état avec design amélioré */}
        <div className="flex justify-center mb-8">
          <div 
            className="p-6 rounded-xl shadow-inner max-w-xl border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: `${COLORS.PRIMARY}30`,
            }}
          >
            <p 
              className="text-center"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              🚜 <strong>Annuaire en construction</strong>
              <br />
              La liste détaillée des producteurs arrive bientôt !
              <br />
              <span className="text-sm">
                Explorez dès maintenant la carte interactive pour découvrir nos premiers partenaires.
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
            Voir la carte interactive
          </Link>
        </div>
      </div>

      {/* ✅ Types de producteurs */}
      <div className="mb-12">
        <h2 
          className="text-2xl font-semibold text-center mb-8"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          🌾 Types de producteurs sur la plateforme
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {producerTypes.map((type) => (
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
              <div className="text-center">
                <div className="text-3xl mb-3">{type.emoji}</div>
                <h3 
                  className="font-semibold mb-2"
                  style={{ color: type.color }}
                >
                  {type.name}
                </h3>
                <p 
                  className="text-sm mb-4"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {type.description}
                </p>
                
                {/* Spécialités */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {type.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 rounded-full text-xs"
                        style={{
                          backgroundColor: `${type.color}20`,
                          color: type.color,
                        }}
                      >
                        {specialty}
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
                  {type.count} producteurs prévus
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Section certifications et méthodes */}
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
          🏆 Nos critères de sélection
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Certifications */}
          <div>
            <h3 
              className="font-semibold mb-4 flex items-center"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              ✅ Certifications acceptées
            </h3>
            <div className="space-y-2">
              {CERTIFICATIONS.map((cert, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS.SUCCESS }}
                  />
                  <span 
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {cert}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Méthodes de production */}
          <div>
            <h3 
              className="font-semibold mb-4 flex items-center"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              🌱 Méthodes de production
            </h3>
            <div className="space-y-2">
              {PRODUCTION_METHODS.map((method, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: COLORS.PRIMARY }}
                  />
                  <span 
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {method}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Call-to-action pour devenir producteur */}
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
          🚜 Vous êtes producteur ?
        </h2>
        <p 
          className="text-lg mb-6 max-w-2xl mx-auto"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Rejoignez notre communauté de producteurs engagés et donnez plus de 
          visibilité à vos produits locaux et authentiques.
        </p>
        
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
            Devenir producteur partenaire
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
  );
}