"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Page de confirmation après envoi d'un feedback
 * 
 * Features:
 * - Message de remerciement avec icône de succès
 * - Design centré et accessible
 * - Navigation de retour vers l'accueil
 * - Configuration centralisée des couleurs
 */
export default function FeedbackSuccessPage(): JSX.Element {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {/* ✅ Fil d'Ariane */}
      <Breadcrumb />

      <div className="flex flex-col items-center justify-center space-y-8">
        {/* ✅ Icône de succès avec animation */}
        <div 
          className={cn(
            "relative p-4 rounded-full",
            "animate-in zoom-in-50 duration-500"
          )}
          style={{ 
            backgroundColor: `${COLORS.SUCCESS}20`,
            color: COLORS.SUCCESS 
          }}
        >
          <svg
            className="h-16 w-16 mx-auto"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
          
          {/* Cercles animés autour de l'icône */}
          <div 
            className="absolute inset-0 rounded-full animate-ping"
            style={{ 
              backgroundColor: `${COLORS.SUCCESS}10` 
            }}
          />
        </div>

        {/* ✅ Titre principal */}
        <h1 
          className="text-4xl font-bold animate-in slide-in-from-bottom-4 duration-700"
          style={{ color: COLORS.PRIMARY_DARK }}
        >
          Merci pour votre retour ! 🙏
        </h1>

        {/* ✅ Message de remerciement enrichi */}
        <div className="space-y-4 max-w-lg">
          <p 
            className="text-lg animate-in slide-in-from-bottom-4 duration-700 delay-150"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Nous apprécions sincèrement votre aide pour améliorer Farm To Fork.
          </p>
          <p 
            className="text-sm animate-in slide-in-from-bottom-4 duration-700 delay-300"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Votre retour sera examiné par notre équipe et nous vous répondrons 
            dans les 48 heures si une réponse est nécessaire.
          </p>
        </div>

        {/* ✅ Section impact */}
        <div 
          className={cn(
            "p-6 rounded-lg border max-w-md",
            "animate-in slide-in-from-bottom-4 duration-700 delay-500"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}20`,
          }}
        >
          <h3 
            className="font-semibold mb-2"
            style={{ color: COLORS.PRIMARY }}
          >
            🌱 Votre contribution compte
          </h3>
          <p 
            className="text-sm"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Grâce aux retours comme le vôtre, nous avons déjà pu implémenter 
            plus de 85% des suggestions reçues.
          </p>
        </div>

        {/* ✅ Boutons d'action */}
        <div 
          className={cn(
            "flex flex-col sm:flex-row gap-4 justify-center",
            "animate-in slide-in-from-bottom-4 duration-700 delay-700"
          )}
        >
          <Button 
            asChild 
            className={cn(
              "px-6 py-3 rounded-lg font-semibold",
              "transition-all duration-200 hover:shadow-md",
              "focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
          >
            <Link href={PATHS.HOME}>Retour à l'accueil</Link>
          </Button>
          
          <Button 
            asChild 
            variant="outline"
            className={cn(
              "px-6 py-3 rounded-lg font-semibold border-2",
              "transition-all duration-200 hover:shadow-md",
              "focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            )}
            style={{
              borderColor: COLORS.PRIMARY,
              color: COLORS.PRIMARY,
            }}
          >
            <Link href={PATHS.LISTINGS}>Découvrir les producteurs</Link>
          </Button>
        </div>

        {/* ✅ Section suggestions d'actions */}
        <div 
          className={cn(
            "mt-12 text-center animate-in fade-in duration-1000 delay-1000"
          )}
        >
          <h4 
            className="font-medium mb-4"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            En attendant, découvrez :
          </h4>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              { label: "Nos producteurs", href: "/discover/producteurs" },
              { label: "Les marchés locaux", href: "/discover/marches" },
              { label: "Devenir producteur", href: PATHS.BECOME_FARMER },
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
    </div>
  );
}