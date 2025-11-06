"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CheckCircle } from "@/utils/icons";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { COLORS, PATHS } from "@/lib/config";

/**
 * Page de confirmation après envoi d'une demande producteur
 * 
 * Features:
 * - Message de succès avec icône
 * - Instructions pour les étapes suivantes
 * - Design centré et accessible
 * - Intégration avec la configuration centralisée
 */
export default function RequestConfirmationPage(): JSX.Element {
  return (
    <div className="container max-w-md mx-auto py-16 px-4">
      <Card 
        className="border-t-4"
        style={{ borderTopColor: COLORS.PRIMARY }}
      >
        <CardHeader className="text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle 
              className="h-16 w-16" 
              style={{ color: COLORS.SUCCESS }}
              aria-hidden="true"
            />
          </div>
          <CardTitle 
            className="text-2xl font-bold"
            style={{ color: COLORS.PRIMARY }}
          >
            Demande envoyée avec succès !
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Merci de votre intérêt pour devenir producteur sur Farm to Fork.
            Notre équipe examinera votre demande dans les plus brefs délais.
          </p>

          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Vous recevrez une notification par email dès que votre demande sera
            traitée.
          </p>

          {/* ✅ Section informative avec couleurs configurées */}
          <div 
            className={cn(
              "py-4 px-4 rounded-lg border text-sm mt-6",
              "transition-colors duration-200"
            )}
            style={{ 
              backgroundColor: COLORS.PRIMARY_BG,
              borderColor: `${COLORS.PRIMARY}20`, // 12.5% opacity
              color: COLORS.PRIMARY_DARK,
            }}
          >
            <p className="font-semibold mb-2">
              <strong>Que se passe-t-il ensuite ?</strong>
            </p>
            <ul className="list-disc pl-5 mt-2 text-left space-y-1">
              <li>Notre équipe examine votre demande (1-2 jours ouvrés)</li>
              <li>Vous recevez un email de confirmation</li>
              <li>Une fois approuvé, vous pourrez ajouter vos produits</li>
            </ul>
          </div>

          {/* ✅ Section avantages supplémentaire */}
          <div className="mt-6 pt-4">
            <h3 
              className="font-semibold text-sm mb-3"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              En attendant, découvrez les avantages :
            </h3>
            <div className="grid grid-cols-1 gap-2 text-left">
              {[
                "Visibilité gratuite sur notre plateforme",
                "Connexion directe avec les consommateurs locaux",
                "Support des circuits courts et durables",
                "Interface simple pour gérer vos produits"
              ].map((advantage, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <div 
                    className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: COLORS.SUCCESS }}
                  >
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span 
                    className="text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {advantage}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2">
          {/* Bouton principal */}
          <Link href={PATHS.HOME} className="w-full">
            <Button 
              className={cn(
                "w-full transition-all duration-200",
                "hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
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
              Retour à l'accueil
            </Button>
          </Link>

          {/* Lien secondaire */}
          <Link 
            href="/listings" 
            className={cn(
              "text-sm underline transition-colors duration-200",
              "hover:no-underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-1"
            )}
            style={{ color: COLORS.PRIMARY }}
          >
            Découvrir les producteurs existants
          </Link>
        </CardFooter>
      </Card>

      {/* ✅ Section aide optionnelle */}
      <div className="mt-8 text-center">
        <p 
          className="text-sm mb-2"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Des questions sur votre demande ?
        </p>
        <Link 
          href="/contact"
          className={cn(
            "text-sm font-medium underline transition-colors duration-200",
            "hover:no-underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-1"
          )}
          style={{ color: COLORS.PRIMARY }}
        >
          Contactez notre équipe
        </Link>
      </div>
    </div>
  );
}