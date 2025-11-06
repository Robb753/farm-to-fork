"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les améliorations apportées
 */
interface Improvement {
  id: string;
  text: string;
  emoji: string;
  category: string;
}

/**
 * Page d'accueil des retours utilisateurs
 * 
 * Features:
 * - Présentation de l'importance des retours utilisateurs
 * - Exemples d'améliorations basées sur les feedbacks
 * - Call-to-action vers le formulaire de feedback
 * - Design responsive et accessible
 */
export default function FeedbackHomePage(): JSX.Element {
  /**
   * Liste des améliorations apportées grâce aux retours
   */
  const improvements: Improvement[] = [
    {
      id: "map",
      text: "Amélioration de la carte interactive",
      emoji: "📍",
      category: "Interface"
    },
    {
      id: "farms",
      text: "Ajout de nouvelles fermes locales",
      emoji: "🐑",
      category: "Contenu"
    },
    {
      id: "performance",
      text: "Optimisation du temps de chargement",
      emoji: "🚀",
      category: "Performance"
    },
    {
      id: "filters",
      text: "Nouveaux filtres de recherche",
      emoji: "🔍",
      category: "Fonctionnalité"
    },
    {
      id: "mobile",
      text: "Application mobile plus intuitive",
      emoji: "📱",
      category: "UX/UI"
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* ✅ Fil d'Ariane */}
      <Breadcrumb />

      <div className="text-center space-y-8">
        {/* ✅ Titre principal */}
        <h1 
          className="text-4xl font-bold"
          style={{ color: COLORS.PRIMARY_DARK }}
        >
          Aidez-nous à améliorer Farm To Fork 🌱
        </h1>

        {/* ✅ Description */}
        <p 
          className="text-lg max-w-2xl mx-auto"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Vos idées, vos suggestions et vos retours sont essentiels pour
          construire une meilleure plateforme. Ensemble, faisons grandir l'écosystème local !
        </p>

        {/* ✅ Bouton principal */}
        <Button 
          asChild 
          className={cn(
            "text-lg px-8 py-3 rounded-lg font-semibold",
            "transition-all duration-200 hover:shadow-md",
            "focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY,
            color: COLORS.BG_WHITE,
          }}
        >
          <Link href="/feedback/form">Donner mon avis</Link>
        </Button>

        {/* ✅ Section améliorations avec design enrichi */}
        <div className="mt-16">
          <h2 
            className="text-2xl font-semibold mb-8"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Ce que vos retours ont permis d'accomplir :
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {improvements.map((improvement) => (
              <div
                key={improvement.id}
                className={cn(
                  "flex items-start space-x-3 p-4 rounded-lg border text-left",
                  "transition-colors duration-200 hover:shadow-sm"
                )}
                style={{
                  backgroundColor: COLORS.BG_WHITE,
                  borderColor: COLORS.BORDER,
                }}
              >
                <div className="text-2xl flex-shrink-0">
                  {improvement.emoji}
                </div>
                <div className="flex-1">
                  <p 
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {improvement.text}
                  </p>
                  <span 
                    className="text-xs px-2 py-1 rounded-full mt-1 inline-block"
                    style={{
                      backgroundColor: `${COLORS.PRIMARY}20`,
                      color: COLORS.PRIMARY,
                    }}
                  >
                    {improvement.category}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Section statistiques */}
        <div 
          className="mt-16 p-8 rounded-2xl border"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}20`,
          }}
        >
          <h3 
            className="text-xl font-semibold mb-6"
            style={{ color: COLORS.PRIMARY }}
          >
            📊 L'impact de votre voix
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { number: "250+", label: "Retours reçus", desc: "Depuis le lancement" },
              { number: "85%", label: "Suggestions implémentées", desc: "Dans les 3 mois" },
              { number: "48h", label: "Temps de réponse moyen", desc: "À vos questions" },
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

        {/* ✅ Section types de feedback */}
        <div className="mt-16">
          <h3 
            className="text-xl font-semibold mb-6"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            💭 Types de retours qui nous aident le plus
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "🐛", title: "Bugs", desc: "Problèmes techniques" },
              { icon: "💡", title: "Idées", desc: "Nouvelles fonctionnalités" },
              { icon: "🎨", title: "Design", desc: "Améliorations visuelles" },
              { icon: "📝", title: "Contenu", desc: "Informations manquantes" },
            ].map((type, index) => (
              <div
                key={index}
                className={cn(
                  "p-4 rounded-lg border text-center",
                  "transition-colors duration-200 hover:shadow-sm"
                )}
                style={{
                  backgroundColor: COLORS.BG_WHITE,
                  borderColor: COLORS.BORDER,
                }}
              >
                <div className="text-2xl mb-2">{type.icon}</div>
                <div 
                  className="font-medium mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {type.title}
                </div>
                <div 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {type.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ✅ Section confidentialité avec design amélioré */}
        <div 
          className="mt-16 p-6 rounded-lg border"
          style={{
            backgroundColor: COLORS.BG_GRAY,
            borderColor: COLORS.BORDER,
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="text-2xl">🔒</div>
            <div className="text-left">
              <h4 
                className="font-medium mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Vos données sont protégées
              </h4>
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Consultez notre{" "}
                <Link 
                  href="/legal/privacy-policy" 
                  className={cn(
                    "underline hover:no-underline transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                  )}
                  style={{ color: COLORS.PRIMARY }}
                >
                  Politique de confidentialité
                </Link>{" "}
                pour savoir comment nous protégeons vos données personnelles.
              </p>
            </div>
          </div>
        </div>

        {/* ✅ Call-to-action final */}
        <div className="mt-12 space-y-4">
          <p 
            className="text-lg font-medium"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Prêt à partager votre expérience ?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              className={cn(
                "px-6 py-2 rounded-lg font-medium",
                "transition-all duration-200 hover:shadow-md"
              )}
              style={{
                backgroundColor: COLORS.PRIMARY,
                color: COLORS.BG_WHITE,
              }}
            >
              <Link href="/feedback/form">Donner mon avis</Link>
            </Button>
            <Button 
              asChild 
              variant="outline"
              className={cn(
                "px-6 py-2 rounded-lg font-medium border-2",
                "transition-all duration-200 hover:shadow-md"
              )}
              style={{
                borderColor: COLORS.PRIMARY,
                color: COLORS.PRIMARY,
              }}
            >
              <Link href={PATHS.CONTACT}>Nous contacter</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}