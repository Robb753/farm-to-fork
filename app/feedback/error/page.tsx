"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { cn } from "@/lib/utils";
import { COLORS, PATHS } from "@/lib/config";

/**
 * Page d'erreur après échec d'envoi d'un feedback
 * 
 * Features:
 * - Message d'erreur clair avec icône
 * - Actions de récupération (réessayer, contact)
 * - Design centré et accessible
 * - Configuration centralisée des couleurs
 */
export default function FeedbackErrorPage(): JSX.Element {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center">
      {/* ✅ Fil d'Ariane */}
      <Breadcrumb />

      <div className="flex flex-col items-center justify-center space-y-8">
        {/* ✅ Icône d'erreur avec animation */}
        <div 
          className={cn(
            "relative p-4 rounded-full",
            "animate-in zoom-in-50 duration-500"
          )}
          style={{ 
            backgroundColor: `${COLORS.ERROR}20`,
            color: COLORS.ERROR 
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
              d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
            />
          </svg>
          
          {/* Cercles animés autour de l'icône */}
          <div 
            className="absolute inset-0 rounded-full animate-ping"
            style={{ 
              backgroundColor: `${COLORS.ERROR}10` 
            }}
          />
        </div>

        {/* ✅ Titre principal */}
        <h1 
          className="text-4xl font-bold animate-in slide-in-from-bottom-4 duration-700"
          style={{ color: COLORS.ERROR }}
        >
          Oups, une erreur est survenue 😕
        </h1>

        {/* ✅ Message d'erreur enrichi */}
        <div className="space-y-4 max-w-lg">
          <p 
            className="text-lg animate-in slide-in-from-bottom-4 duration-700 delay-150"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Nous n'avons pas pu traiter votre message. Cela peut être temporaire.
          </p>
          <p 
            className="text-sm animate-in slide-in-from-bottom-4 duration-700 delay-300"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Veuillez vérifier votre connexion internet et réessayer dans quelques instants.
          </p>
        </div>

        {/* ✅ Section aide au diagnostic */}
        <div 
          className={cn(
            "p-6 rounded-lg border max-w-md",
            "animate-in slide-in-from-bottom-4 duration-700 delay-500"
          )}
          style={{
            backgroundColor: COLORS.BG_GRAY,
            borderColor: COLORS.BORDER,
          }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            🔧 Quelques vérifications
          </h3>
          <ul 
            className="text-sm text-left space-y-2"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Vérifiez votre connexion internet</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Tous les champs obligatoires sont-ils remplis ?</span>
            </li>
            <li className="flex items-start space-x-2">
              <span>•</span>
              <span>Votre adresse email est-elle valide ?</span>
            </li>
          </ul>
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
              "focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            )}
            style={{
              backgroundColor: COLORS.ERROR,
              color: COLORS.BG_WHITE,
            }}
          >
            <Link href="/feedback/form">Réessayer</Link>
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
            <Link href={PATHS.CONTACT}>Nous contacter</Link>
          </Button>
        </div>

        {/* ✅ Section solutions alternatives */}
        <div 
          className={cn(
            "mt-12 p-6 rounded-lg border",
            "animate-in fade-in duration-1000 delay-1000"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}20`,
          }}
        >
          <h4 
            className="font-semibold mb-4"
            style={{ color: COLORS.PRIMARY }}
          >
            💬 Autres moyens de nous contacter
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl mb-2">📧</div>
              <div 
                className="font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Email direct
              </div>
              <a 
                href="mailto:contact@farmtofork.fr"
                className={cn(
                  "hover:underline transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                )}
                style={{ color: COLORS.PRIMARY }}
              >
                contact@farmtofork.fr
              </a>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">💬</div>
              <div 
                className="font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Chat en direct
              </div>
              <Link 
                href={PATHS.CONTACT}
                className={cn(
                  "hover:underline transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                )}
                style={{ color: COLORS.PRIMARY }}
              >
                Ouvrir le chat
              </Link>
            </div>
          </div>
        </div>

        {/* ✅ Message d'encouragement */}
        <div 
          className={cn(
            "mt-8 text-center animate-in fade-in duration-1000 delay-1200"
          )}
        >
          <p 
            className="text-sm"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            Votre feedback est important pour nous. Nous nous excusons pour ce désagrément 
            et ferons tout notre possible pour résoudre le problème rapidement.
          </p>
        </div>
      </div>
    </div>
  );
}