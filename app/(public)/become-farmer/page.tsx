"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Page de présentation pour devenir producteur
 *
 * Features:
 * - Présentation des avantages de rejoindre la plateforme
 * - Étapes simplifiées pour créer une fiche producteur
 * - Call-to-action vers l'inscription producteur
 * - Design responsive et accessible
 */
export default function BecomeFarmerPage(): JSX.Element {
  return (
    <div
      className="text-gray-800"
      style={{
        backgroundColor: COLORS.BG_WHITE,
        color: COLORS.TEXT_PRIMARY,
      }}
    >
      {/* ✅ SECTION HERO */}
      <section className="max-w-5xl mx-auto px-6 py-16 text-center">
        <h1
          className="text-4xl md:text-5xl font-bold mb-4"
          style={{ color: COLORS.PRIMARY }}
        >
          Gagnez en visibilité avec Farm To Fork
        </h1>
        <p className="text-lg mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
          Publiez votre ferme, présentez vos produits et connectez-vous avec des
          consommateurs locaux.
        </p>
        <Link
          href="/signup-farmer"
          className={cn(
            "inline-block text-white text-lg px-6 py-3 rounded-md font-semibold",
            "transition-all duration-200",
            "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
          }}
        >
          Démarrer maintenant
        </Link>
      </section>

      {/* ✅ SECTION ÉTAPES SIMPLIFIÉES */}
      <section className="py-12" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2
            className="text-3xl font-semibold mb-8"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Publier votre ferme, c'est simple
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {/* Étape 1 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mb-4"
                style={{ backgroundColor: COLORS.PRIMARY }}
              >
                1
              </div>
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Créez votre fiche
              </h3>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                Ajoutez le nom, l'adresse et une description de votre ferme.
                Vous pouvez la publier plus tard.
              </p>
            </div>

            {/* Étape 2 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mb-4"
                style={{ backgroundColor: COLORS.PRIMARY }}
              >
                2
              </div>
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Mettez vos produits en avant
              </h3>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                Indiquez les types de produits disponibles (légumes, œufs,
                etc.).
              </p>
            </div>

            {/* Étape 3 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold mb-4"
                style={{ backgroundColor: COLORS.PRIMARY }}
              >
                3
              </div>
              <h3
                className="font-bold text-lg mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Attendez la validation
              </h3>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                Une fois validée, votre fiche apparaîtra sur la carte et sera
                accessible à tous les utilisateurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ✅ SECTION MISE EN VALEUR */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <h2
          className="text-3xl font-semibold mb-4"
          style={{ color: COLORS.PRIMARY }}
        >
          Rejoignez un réseau local engagé
        </h2>
        <p className="text-lg mb-8" style={{ color: COLORS.TEXT_SECONDARY }}>
          Farm To Fork soutient les circuits courts et la mise en valeur des
          producteurs locaux. Ensemble, rendons l'alimentation plus durable.
        </p>
        <Link
          href="/signup-farmer"
          className={cn(
            "inline-block text-white text-lg px-6 py-3 rounded-md font-semibold",
            "transition-all duration-200",
            "hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
          }}
        >
          Je crée ma fiche maintenant
        </Link>
      </section>

      {/* ✅ SECTION AVANTAGES SUPPLÉMENTAIRES */}
      <section className="py-12" style={{ backgroundColor: COLORS.PRIMARY_BG }}>
        <div className="max-w-4xl mx-auto px-6">
          <h2
            className="text-2xl font-semibold text-center mb-8"
            style={{ color: COLORS.PRIMARY }}
          >
            Pourquoi choisir Farm To Fork ?
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Avantage 1 */}
            <div className="flex items-start space-x-4">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ backgroundColor: COLORS.SUCCESS }}
              >
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Visibilité locale accrue
                </h3>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Votre ferme apparaît sur une carte interactive consultée par
                  des milliers de consommateurs locaux.
                </p>
              </div>
            </div>

            {/* Avantage 2 */}
            <div className="flex items-start space-x-4">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ backgroundColor: COLORS.SUCCESS }}
              >
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Gratuit et sans engagement
                </h3>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Créez votre fiche gratuitement. Aucun abonnement, aucuns frais
                  cachés.
                </p>
              </div>
            </div>

            {/* Avantage 3 */}
            <div className="flex items-start space-x-4">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ backgroundColor: COLORS.SUCCESS }}
              >
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Support des circuits courts
                </h3>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Participez à un mouvement qui valorise la production locale et
                  durable.
                </p>
              </div>
            </div>

            {/* Avantage 4 */}
            <div className="flex items-start space-x-4">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
                style={{ backgroundColor: COLORS.SUCCESS }}
              >
                <span className="text-white text-sm">✓</span>
              </div>
              <div>
                <h3
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Interface simple
                </h3>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Gérez facilement votre fiche producteur avec notre interface
                  intuitive.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
