"use client";

import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les sections de la politique
 */
interface PolicySection {
  id: string;
  title: string;
  content: React.ReactNode;
}

/**
 * Page de politique de cookies
 * 
 * Features:
 * - Présentation claire de la politique de cookies
 * - Design responsive et accessible
 * - Configuration centralisée des couleurs
 * - Structure sémantique avec sections
 */
export default function CookiesPolicyPage(): JSX.Element {
  const lastUpdated = "29/04/2025";

  /**
   * Configuration des sections de la politique
   */
  const policySections: PolicySection[] = [
    {
      id: "definition",
      title: "Qu'est-ce qu'un cookie ?",
      content: (
        <p>
          Un cookie est un petit fichier texte enregistré sur votre appareil
          lors de la visite d'un site internet. Il permet de reconnaître votre
          appareil et d'améliorer votre expérience utilisateur, sans révéler
          directement votre identité.
        </p>
      ),
    },
    {
      id: "types",
      title: "Quels cookies utilisons-nous ?",
      content: (
        <div className="space-y-4">
          <p>
            Notre plateforme Farm To Fork utilise différents types de cookies
            pour vous offrir la meilleure expérience possible :
          </p>
          <ul 
            className="space-y-3 ml-6"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            <li className="flex items-start gap-3">
              <span 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: COLORS.PRIMARY }}
              />
              <div>
                <strong style={{ color: COLORS.TEXT_PRIMARY }}>
                  Cookies techniques essentiels
                </strong>
                <br />
                Nécessaires au bon fonctionnement du site (authentification, 
                panier, préférences de langue)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: COLORS.PRIMARY }}
              />
              <div>
                <strong style={{ color: COLORS.TEXT_PRIMARY }}>
                  Cookies analytiques
                </strong>
                <br />
                Mesure d'audience anonymisée pour améliorer nos services 
                (Google Analytics, données agrégées)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: COLORS.PRIMARY }}
              />
              <div>
                <strong style={{ color: COLORS.TEXT_PRIMARY }}>
                  Cookies fonctionnels
                </strong>
                <br />
                Amélioration de l'expérience utilisateur (géolocalisation pour 
                trouver des fermes proches, mémorisation des filtres)
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span 
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: COLORS.WARNING }}
              />
              <div>
                <strong style={{ color: COLORS.TEXT_PRIMARY }}>
                  Cookies publicitaires
                </strong>
                <br />
                Soumis à votre consentement explicite via notre gestionnaire 
                de cookies Axeptio
              </div>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "management",
      title: "Gestion des cookies",
      content: (
        <div className="space-y-4">
          <p>
            Vous avez un contrôle total sur les cookies utilisés sur notre site :
          </p>
          
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: COLORS.PRIMARY_BG,
              borderColor: `${COLORS.PRIMARY}30`,
            }}
          >
            <h4 
              className="font-semibold mb-2"
              style={{ color: COLORS.PRIMARY }}
            >
              🍪 Gestionnaire de cookies Axeptio
            </h4>
            <p 
              className="text-sm"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Lors de votre première visite, un bandeau vous permet de 
              paramétrer votre consentement. Vous pouvez modifier vos 
              préférences à tout moment en cliquant sur l'icône Axeptio 
              en bas à gauche du site.
            </p>
          </div>

          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: COLORS.BG_GRAY,
              borderColor: COLORS.BORDER,
            }}
          >
            <h4 
              className="font-semibold mb-2"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              ⚙️ Paramètres du navigateur
            </h4>
            <p 
              className="text-sm mb-2"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              Vous pouvez également configurer votre navigateur pour :
            </p>
            <ul 
              className="text-sm space-y-1 ml-4"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              <li>• Refuser tous les cookies</li>
              <li>• Être notifié avant chaque cookie</li>
              <li>• Supprimer les cookies existants</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "purpose",
      title: "Pourquoi utilisons-nous des cookies ?",
      content: (
        <div className="space-y-4">
          <p>
            Les cookies nous aident à vous offrir une meilleure expérience
            sur Farm To Fork :
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: "🎯",
                title: "Personnalisation",
                desc: "Affichage des fermes près de chez vous"
              },
              {
                icon: "📊", 
                title: "Amélioration",
                desc: "Analyse du trafic pour optimiser le site"
              },
              {
                icon: "🔒",
                title: "Sécurité",
                desc: "Protection de votre session et vos données"
              },
              {
                icon: "⚡",
                title: "Performance",
                desc: "Chargement plus rapide des pages"
              },
            ].map((item, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: COLORS.BG_WHITE,
                  borderColor: COLORS.BORDER,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{item.icon}</span>
                  <h5 
                    className="font-medium"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {item.title}
                  </h5>
                </div>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "duration",
      title: "Durée de conservation",
      content: (
        <div className="space-y-4">
          <p>
            La durée de conservation des cookies varie selon leur type :
          </p>
          <div className="overflow-x-auto">
            <table 
              className="w-full border-collapse border rounded-lg"
              style={{ borderColor: COLORS.BORDER }}
            >
              <thead>
                <tr style={{ backgroundColor: COLORS.BG_GRAY }}>
                  <th 
                    className="border p-3 text-left font-semibold"
                    style={{ 
                      borderColor: COLORS.BORDER,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Type de cookie
                  </th>
                  <th 
                    className="border p-3 text-left font-semibold"
                    style={{ 
                      borderColor: COLORS.BORDER,
                      color: COLORS.TEXT_PRIMARY,
                    }}
                  >
                    Durée
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Cookies de session", "Supprimés à la fermeture du navigateur"],
                  ["Cookies techniques", "1 an maximum"],
                  ["Cookies analytiques", "26 mois (Google Analytics)"],
                  ["Cookies publicitaires", "13 mois maximum"],
                ].map(([type, duration], index) => (
                  <tr key={index}>
                    <td 
                      className="border p-3"
                      style={{ 
                        borderColor: COLORS.BORDER,
                        color: COLORS.TEXT_PRIMARY,
                      }}
                    >
                      {type}
                    </td>
                    <td 
                      className="border p-3"
                      style={{ 
                        borderColor: COLORS.BORDER,
                        color: COLORS.TEXT_SECONDARY,
                      }}
                    >
                      {duration}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div 
      className="min-h-screen py-12"
      style={{ backgroundColor: COLORS.BG_GRAY }}
    >
      <div className="max-w-4xl mx-auto px-4">
        {/* ✅ En-tête */}
        <header className="text-center mb-12">
          <h1 
            className="text-4xl font-bold mb-4"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            🍪 Politique de Cookies
          </h1>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Transparence totale sur l'utilisation des cookies sur Farm To Fork.
            Votre vie privée est notre priorité.
          </p>
        </header>

        {/* ✅ Contenu principal */}
        <div 
          className="rounded-lg shadow-sm border p-8"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <div className="space-y-8">
            {policySections.map((section, index) => (
              <section 
                key={section.id}
                className={cn(
                  "scroll-mt-8",
                  index > 0 && "border-t pt-8"
                )}
                style={{
                  borderColor: index > 0 ? COLORS.BORDER : "transparent",
                }}
                id={section.id}
              >
                <h2 
                  className="text-2xl font-semibold mb-4"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {section.title}
                </h2>
                <div 
                  className="prose max-w-none"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          {/* ✅ Contact et mise à jour */}
          <div 
            className="mt-12 pt-8 border-t"
            style={{ borderColor: COLORS.BORDER }}
          >
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.PRIMARY_BG,
                borderColor: `${COLORS.PRIMARY}30`,
              }}
            >
              <h3 
                className="font-semibold mb-2"
                style={{ color: COLORS.PRIMARY }}
              >
                💬 Questions sur notre politique de cookies ?
              </h3>
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Contactez-nous à{" "}
                <a 
                  href="mailto:privacy@farmtofork.fr"
                  className="underline hover:no-underline"
                  style={{ color: COLORS.PRIMARY }}
                >
                  privacy@farmtofork.fr
                </a>
                {" "}pour toute question concernant l'utilisation de vos données.
              </p>
            </div>

            <p 
              className="text-sm mt-6 text-center"
              style={{ color: COLORS.TEXT_MUTED }}
            >
              📅 Dernière mise à jour : {lastUpdated}
            </p>
          </div>
        </div>

        {/* ✅ Navigation rapide */}
        <nav 
          className="mt-8 p-4 rounded-lg border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <h3 
            className="font-semibold mb-3"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            🧭 Navigation rapide
          </h3>
          <div className="flex flex-wrap gap-2">
            {policySections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={cn(
                  "px-3 py-1 rounded-full text-sm transition-colors duration-200",
                  "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                )}
                style={{
                  backgroundColor: `${COLORS.PRIMARY}20`,
                  color: COLORS.PRIMARY,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}20`;
                }}
              >
                {section.title}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}