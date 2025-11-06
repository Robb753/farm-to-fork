"use client";

import { useTranslation } from "@/lib/store/settingsStore";
import React from "react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interface pour les éléments de fonctionnalité
 */
interface FeatureItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color?: string;
}

/**
 * Composant de présentation des valeurs européennes
 * 
 * Features:
 * - Utilisation du système de traduction centralisé
 * - Design responsive avec icônes SVG
 * - Configuration centralisée des couleurs
 * - Accessibilité optimisée
 */
function EuropeanFeatures(): JSX.Element {
  const t = useTranslation();

  /**
   * Configuration des fonctionnalités avec icônes
   */
  const features: Omit<FeatureItemProps, 'color'>[] = [
    {
      title: t("quality"),
      description: t("quality_desc"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
    {
      title: t("terroir"),
      description: t("terroir_desc"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      title: t("tradition"),
      description: t("tradition_desc"),
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
      ),
    },
  ];

  return (
    <section 
      className={cn(
        "px-4 py-12 md:px-6 border-t"
      )}
      style={{
        backgroundColor: COLORS.BG_GRAY,
        borderColor: COLORS.BORDER,
      }}
    >
      <div className="max-w-7xl mx-auto mb-10 mt-10">
        {/* ✅ Titre principal avec traduction */}
        <div className="text-center mb-12">
          <h2 
            className="text-4xl font-serif font-bold mb-4"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {t("philosophy")}
          </h2>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Nos valeurs européennes au service de l'agriculture locale et durable
          </p>
        </div>

        {/* ✅ Grid des fonctionnalités */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <FeatureItem
              key={index}
              title={feature.title}
              description={feature.description}
              icon={feature.icon}
              color={COLORS.PRIMARY_DARK}
            />
          ))}
        </div>

        {/* ✅ Section complémentaire sur les valeurs */}
        <div className="mt-16 text-center">
          <div 
            className="max-w-4xl mx-auto p-8 rounded-2xl border"
            style={{
              backgroundColor: COLORS.PRIMARY_BG,
              borderColor: `${COLORS.PRIMARY}20`,
            }}
          >
            <h3 
              className="text-2xl font-semibold mb-4"
              style={{ color: COLORS.PRIMARY }}
            >
              🇪🇺 Une vision européenne de l'agriculture
            </h3>
            <p 
              className="text-lg mb-6"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Farm to Fork s'inspire des meilleures pratiques européennes en matière 
              de sécurité alimentaire, de respect de l'environnement et de valorisation 
              du patrimoine gastronomique local.
            </p>
            
            {/* Statistiques européennes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              {[
                {
                  number: "27",
                  label: "Pays européens",
                  desc: "Diversité des terroirs"
                },
                {
                  number: "500+",
                  label: "AOP/IGP",
                  desc: "Appellations protégées"
                },
                {
                  number: "30%",
                  label: "Bio en 2030",
                  desc: "Objectif européen"
                },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div 
                    className="text-3xl font-bold"
                    style={{ color: COLORS.PRIMARY }}
                  >
                    {stat.number}
                  </div>
                  <div 
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {stat.label}
                  </div>
                  <div 
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {stat.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Composant modulaire pour chaque élément de fonctionnalité
 */
function FeatureItem({ 
  title, 
  description, 
  icon, 
  color = COLORS.PRIMARY_DARK 
}: FeatureItemProps): JSX.Element {
  return (
    <div className="flex flex-col items-center text-center">
      {/* ✅ Icône avec couleur configurée */}
      <div 
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4",
          "shadow-md transition-transform duration-300 hover:scale-105"
        )}
        style={{ backgroundColor: color }}
        role="img"
        aria-label={`Icône pour ${title}`}
      >
        {icon}
      </div>
      
      {/* ✅ Titre avec couleur configurée */}
      <h3 
        className="text-xl font-serif font-bold mb-2"
        style={{ color: COLORS.TEXT_PRIMARY }}
      >
        {title}
      </h3>
      
      {/* ✅ Description avec couleur configurée */}
      <p style={{ color: COLORS.TEXT_SECONDARY }}>
        {description}
      </p>
    </div>
  );
}

export default EuropeanFeatures;