"use client";

import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les informations de contact
 */
interface ContactInfo {
  name: string;
  address: string;
  email: string;
  phone?: string;
}

/**
 * Interface pour les informations d'hébergement
 */
interface HostingInfo {
  company: string;
  address: string;
  website: string;
}

/**
 * Interface pour les sections légales
 */
interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

/**
 * Page des mentions légales
 * 
 * Features:
 * - Présentation complète des informations légales
 * - Design responsive et accessible
 * - Configuration centralisée des couleurs
 * - Structure sémantique conforme aux exigences légales
 */
export default function MentionsLegalesPage(): JSX.Element {
  const lastUpdated = "29/04/2025";

  /**
   * Informations de l'éditeur
   */
  const editorInfo: ContactInfo = {
    name: "Robin Schmitt",
    address: "12 rue des Roses, 67500 Haguenau, France",
    email: "info@farmtofork.fr",
  };

  /**
   * Informations de l'hébergeur
   */
  const hostingInfo: HostingInfo = {
    company: "Vercel Inc.",
    address: "340 S Lemon Ave #4133, Walnut, CA 91789, USA",
    website: "https://vercel.com",
  };

  /**
   * Configuration des sections légales
   */
  const legalSections: LegalSection[] = [
    {
      id: "presentation",
      title: "1. Présentation du site",
      content: (
        <div className="space-y-4">
          <p>
            Conformément aux dispositions de la{" "}
            <strong>loi n°2004-575 du 21 juin 2004</strong> pour la Confiance en 
            l'Économie Numérique, il est porté à la connaissance des utilisateurs 
            du site{" "}
            <strong 
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: `${COLORS.PRIMARY}20`,
                color: COLORS.PRIMARY,
              }}
            >
              farmtofork.fr
            </strong>
            {" "}(ci-après « le Site ») les présentes mentions légales.
          </p>
          
          <div 
            className="p-4 rounded-lg border-l-4"
            style={{
              backgroundColor: COLORS.PRIMARY_BG,
              borderLeftColor: COLORS.PRIMARY,
            }}
          >
            <p 
              className="font-medium"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              ⚖️ Acceptation des mentions légales
            </p>
            <p 
              className="text-sm mt-2"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              La connexion et la navigation sur le Site par l'Utilisateur 
              impliquent l'acceptation intégrale et sans réserve des présentes 
              mentions légales.
            </p>
          </div>

          <p>
            Ces mentions légales sont accessibles à tout moment sur le Site 
            dans le pied de page et sont mises à jour régulièrement pour 
            refléter les évolutions légales et techniques.
          </p>
        </div>
      ),
    },
    {
      id: "editor",
      title: "2. Éditeur du site",
      content: (
        <div className="space-y-4">
          <p>
            L'édition et la direction de la publication du Site sont assurées par :
          </p>
          
          <div 
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  👤 Responsable de la publication
                </h4>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  <strong>{editorInfo.name}</strong>
                </p>
              </div>
              
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  📍 Adresse
                </h4>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  {editorInfo.address}
                </p>
              </div>
              
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  📧 Contact
                </h4>
                <a
                  href={`mailto:${editorInfo.email}`}
                  className={cn(
                    "hover:underline transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                  )}
                  style={{ color: COLORS.PRIMARY }}
                >
                  {editorInfo.email}
                </a>
              </div>
              
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  🏢 Statut
                </h4>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Entrepreneur individuel
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "hosting",
      title: "3. Hébergeur",
      content: (
        <div className="space-y-4">
          <p>
            Le Site est hébergé par :
          </p>
          
          <div 
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  🏢 Société
                </h4>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  <strong>{hostingInfo.company}</strong>
                </p>
              </div>
              
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  📍 Siège social
                </h4>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  {hostingInfo.address}
                </p>
              </div>
              
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  🌐 Site web
                </h4>
                <a
                  href={hostingInfo.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "hover:underline transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                  )}
                  style={{ color: COLORS.PRIMARY }}
                >
                  {hostingInfo.website}
                </a>
              </div>
              
              <div>
                <h4 
                  className="font-semibold mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  ⚡ Services
                </h4>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Hébergement cloud, CDN, DNS
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "access",
      title: "4. Accès au site",
      content: (
        <div className="space-y-4">
          <p>
            Le Site est normalement accessible à tout moment aux utilisateurs.
          </p>
          
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: `${COLORS.WARNING}10`,
              borderColor: `${COLORS.WARNING}30`,
            }}
          >
            <h4 
              className="font-semibold mb-2"
              style={{ color: COLORS.WARNING }}
            >
              ⚠️ Interruptions de service
            </h4>
            <div 
              className="text-sm space-y-2"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <p>
                L'Éditeur peut décider d'interruptions temporaires pour :
              </p>
              <ul className="ml-4 space-y-1">
                <li>• Maintenance technique programmée</li>
                <li>• Mises à jour de sécurité</li>
                <li>• Améliorations fonctionnelles</li>
                <li>• Cas de force majeure</li>
              </ul>
              <p className="mt-3">
                L'Éditeur ne saurait être tenu responsable de toute 
                indisponibilité temporaire du Site.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "data-collection",
      title: "5. Collecte des données personnelles",
      content: (
        <div className="space-y-4">
          <p>
            Le Site assure à l'Utilisateur une collecte et un traitement des 
            données personnelles dans le respect de la vie privée conformément à :
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h4 
                className="font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                🇫🇷 Loi française
              </h4>
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Loi « Informatique et Libertés » n°78-17 du 6 janvier 1978
              </p>
            </div>
            
            <div 
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h4 
                className="font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                🇪🇺 Règlement européen
              </h4>
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                RGPD - Règlement (UE) 2016/679
              </p>
            </div>
          </div>

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
              🛡️ Vos droits RGPD
            </h4>
            <div 
              className="text-sm space-y-1"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <p>L'Utilisateur dispose des droits suivants :</p>
              <ul className="ml-4 space-y-1">
                <li>• <strong>Droit d'accès</strong> : consulter vos données</li>
                <li>• <strong>Droit de rectification</strong> : corriger vos données</li>
                <li>• <strong>Droit à l'effacement</strong> : supprimer vos données</li>
                <li>• <strong>Droit d'opposition</strong> : refuser certains traitements</li>
                <li>• <strong>Droit à la portabilité</strong> : récupérer vos données</li>
              </ul>
              <p className="mt-3">
                Ces droits peuvent être exercés par email à :{" "}
                <a
                  href={`mailto:${editorInfo.email}`}
                  className="underline hover:no-underline"
                  style={{ color: COLORS.PRIMARY }}
                >
                  {editorInfo.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "intellectual-property",
      title: "6. Propriété intellectuelle",
      content: (
        <div className="space-y-4">
          <p>
            Tous les éléments du Site sont et restent la propriété intellectuelle 
            et exclusive de l'Éditeur.
          </p>
          
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: `${COLORS.ERROR}10`,
              borderColor: `${COLORS.ERROR}30`,
            }}
          >
            <h4 
              className="font-semibold mb-2"
              style={{ color: COLORS.ERROR }}
            >
              🚫 Utilisation interdite
            </h4>
            <div 
              className="text-sm space-y-2"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <p>
                Sans autorisation expresse écrite de l'Éditeur, sont interdits :
              </p>
              <ul className="ml-4 space-y-1">
                <li>• Reproduction totale ou partielle du Site</li>
                <li>• Diffusion ou redistribution du contenu</li>
                <li>• Commercialisation des éléments du Site</li>
                <li>• Modification ou adaptation du contenu</li>
                <li>• Extraction de données automatisée (scraping)</li>
              </ul>
              <p className="mt-3 font-medium">
                ⚖️ Toute violation pourra entraîner des poursuites judiciaires.
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "privacy-cookies",
      title: "7. Protection des données et cookies",
      content: (
        <div className="space-y-4">
          <p>
            Pour plus d'informations détaillées sur la protection de vos données 
            personnelles et l'utilisation des cookies :
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div 
              className="p-4 rounded-lg border hover:shadow-sm transition-shadow duration-200"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h4 
                className="font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                🔒 Politique de Confidentialité
              </h4>
              <p 
                className="text-sm mb-3"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Traitement des données, finalités, durées de conservation
              </p>
              <a
                href="/legal/privacy-policy"
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium",
                  "hover:underline transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                )}
                style={{ color: COLORS.PRIMARY }}
              >
                Consulter la politique
                <span>→</span>
              </a>
            </div>
            
            <div 
              className="p-4 rounded-lg border hover:shadow-sm transition-shadow duration-200"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h4 
                className="font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                🍪 Politique de Cookies
              </h4>
              <p 
                className="text-sm mb-3"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Types de cookies, gestion, durées, consentement
              </p>
              <a
                href="/legal/cookies-policy"
                className={cn(
                  "inline-flex items-center gap-2 text-sm font-medium",
                  "hover:underline transition-colors duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                )}
                style={{ color: COLORS.PRIMARY }}
              >
                Consulter la politique
                <span>→</span>
              </a>
            </div>
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
            ⚖️ Mentions légales
          </h1>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Informations légales obligatoires concernant le site Farm To Fork
            et son éditeur, conformément à la loi française.
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
          <div className="space-y-10">
            {legalSections.map((section, index) => (
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
                  className="text-2xl font-semibold mb-6"
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
                📞 Contact pour questions légales
              </h3>
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Pour toute question relative aux présentes mentions légales,
                contactez-nous à{" "}
                <a 
                  href={`mailto:${editorInfo.email}`}
                  className="underline hover:no-underline"
                  style={{ color: COLORS.PRIMARY }}
                >
                  {editorInfo.email}
                </a>
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
      </div>
    </div>
  );
}