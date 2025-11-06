"use client";

import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les données collectées
 */
interface DataCategory {
  id: string;
  title: string;
  description: string;
  items: string[];
  purpose: string;
  legalBasis: string;
  retention: string;
}

/**
 * Interface pour les droits RGPD
 */
interface UserRight {
  id: string;
  title: string;
  description: string;
  icon: string;
}

/**
 * Interface pour les sections de la politique
 */
interface PolicySection {
  id: string;
  article: string;
  title: string;
  content: React.ReactNode;
}

/**
 * Page de politique de confidentialité
 * 
 * Features:
 * - Politique RGPD complète et détaillée
 * - Structure légale avec articles numérotés
 * - Design responsive et accessible
 * - Configuration centralisée des couleurs
 * - Informations spécifiques à Farm To Fork
 */
export default function PrivacyPolicyPage(): JSX.Element {
  const lastUpdated = "29/04/2025";

  /**
   * Catégories de données collectées
   */
  const dataCategories: DataCategory[] = [
    {
      id: "account",
      title: "Données de compte utilisateur",
      description: "Informations nécessaires à la création et gestion de votre compte",
      items: [
        "Nom et prénom",
        "Adresse e-mail",
        "Mot de passe (chiffré)",
        "Photo de profil (optionnelle)",
        "Préférences de notification"
      ],
      purpose: "Gestion du compte, authentification, personnalisation",
      legalBasis: "Consentement (article 6.1.a RGPD)",
      retention: "Jusqu'à suppression du compte + 3 ans"
    },
    {
      id: "farmer",
      title: "Données producteur",
      description: "Informations spécifiques aux producteurs locaux",
      items: [
        "Nom de la ferme",
        "Adresse de l'exploitation",
        "Numéro de téléphone",
        "Site web (optionnel)",
        "Description de l'activité",
        "Types de produits",
        "Certifications",
        "Photos de la ferme"
      ],
      purpose: "Présentation sur la carte, mise en relation avec consommateurs",
      legalBasis: "Consentement et intérêt légitime (article 6.1.a et 6.1.f RGPD)",
      retention: "Durée d'activité du compte + 1 an"
    },
    {
      id: "navigation",
      title: "Données de navigation",
      description: "Informations collectées automatiquement lors de votre visite",
      items: [
        "Adresse IP (anonymisée)",
        "Type de navigateur",
        "Système d'exploitation",
        "Pages visitées",
        "Durée de session",
        "Géolocalisation approximative (ville)"
      ],
      purpose: "Amélioration du service, statistiques, géolocalisation des fermes",
      legalBasis: "Intérêt légitime (article 6.1.f RGPD)",
      retention: "26 mois maximum (Google Analytics)"
    },
    {
      id: "communication",
      title: "Données de communication",
      description: "Informations lors de vos interactions avec nous",
      items: [
        "Messages via formulaire de contact",
        "Commentaires et avis",
        "Demandes de support",
        "Historique des échanges"
      ],
      purpose: "Répondre à vos demandes, améliorer nos services",
      legalBasis: "Consentement (article 6.1.a RGPD)",
      retention: "3 ans après dernier échange"
    }
  ];

  /**
   * Droits des utilisateurs RGPD
   */
  const userRights: UserRight[] = [
    {
      id: "access",
      title: "Droit d'accès",
      description: "Obtenir une copie de toutes vos données personnelles",
      icon: "🔍"
    },
    {
      id: "rectification",
      title: "Droit de rectification",
      description: "Corriger ou mettre à jour vos informations personnelles",
      icon: "✏️"
    },
    {
      id: "erasure",
      title: "Droit à l'effacement",
      description: "Demander la suppression de vos données (droit à l'oubli)",
      icon: "🗑️"
    },
    {
      id: "portability",
      title: "Droit à la portabilité",
      description: "Récupérer vos données dans un format structuré",
      icon: "📦"
    },
    {
      id: "limitation",
      title: "Droit à la limitation",
      description: "Suspendre temporairement le traitement de vos données",
      icon: "⏸️"
    },
    {
      id: "opposition",
      title: "Droit d'opposition",
      description: "Vous opposer au traitement pour motif légitime",
      icon: "🛑"
    },
    {
      id: "automated",
      title: "Décisions automatisées",
      description: "Ne pas faire l'objet de décisions entièrement automatisées",
      icon: "🤖"
    },
    {
      id: "posthumous",
      title: "Directives posthumes",
      description: "Définir le sort de vos données après votre décès",
      icon: "🕊️"
    }
  ];

  /**
   * Sections de la politique de confidentialité
   */
  const policySections: PolicySection[] = [
    {
      id: "preamble",
      article: "ARTICLE 1",
      title: "PRÉAMBULE",
      content: (
        <div className="space-y-4">
          <p>
            La présente politique de confidentialité a pour but d'informer les
            utilisateurs du site{" "}
            <strong 
              className="px-2 py-1 rounded"
              style={{
                backgroundColor: `${COLORS.PRIMARY}20`,
                color: COLORS.PRIMARY,
              }}
            >
              Farm To Fork
            </strong>
            {" "}sur :
          </p>
          
          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: COLORS.PRIMARY_BG,
              borderColor: `${COLORS.PRIMARY}30`,
            }}
          >
            <h4 
              className="font-semibold mb-3"
              style={{ color: COLORS.PRIMARY }}
            >
              📋 Informations couvertes par cette politique
            </h4>
            <ul 
              className="space-y-2"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              {[
                "La manière dont sont collectées vos données personnelles",
                "Les droits dont vous disposez concernant ces données",
                "L'identité du responsable du traitement",
                "Les destinataires de ces données personnelles",
                "La politique du site en matière de cookies",
                "Les mesures de sécurité mises en place"
              ].map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span 
                    className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                    style={{ backgroundColor: COLORS.PRIMARY }}
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <p>
            Cette politique complète les{" "}
            <a
              href="/legal/mentions-legales"
              className={cn(
                "hover:underline transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
              )}
              style={{ color: COLORS.PRIMARY }}
            >
              mentions légales
            </a>
            {" "}et la{" "}
            <a
              href="/legal/cookies-policy"
              className={cn(
                "hover:underline transition-colors duration-200",
                "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
              )}
              style={{ color: COLORS.PRIMARY }}
            >
              politique de cookies
            </a>
            .
          </p>
        </div>
      ),
    },
    {
      id: "principles",
      article: "ARTICLE 2",
      title: "PRINCIPES RELATIFS À LA COLLECTE ET AU TRAITEMENT",
      content: (
        <div className="space-y-4">
          <p>
            Conformément à l'article 5 du RGPD, Farm To Fork s'engage à traiter
            vos données personnelles selon les principes suivants :
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                principle: "Licéité, loyauté, transparence",
                description: "Traitement légal avec information claire"
              },
              {
                principle: "Finalités déterminées",
                description: "Objectifs précis et légitimes"
              },
              {
                principle: "Minimisation",
                description: "Données limitées au strict nécessaire"
              },
              {
                principle: "Exactitude",
                description: "Informations exactes et tenues à jour"
              },
              {
                principle: "Conservation limitée",
                description: "Durée proportionnée aux finalités"
              },
              {
                principle: "Sécurité",
                description: "Protection contre accès non autorisés"
              }
            ].map((item, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: COLORS.BG_WHITE,
                  borderColor: COLORS.BORDER,
                }}
              >
                <h5 
                  className="font-semibold mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {item.principle}
                </h5>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div 
            className="p-4 rounded-lg border"
            style={{
              backgroundColor: `${COLORS.SUCCESS}10`,
              borderColor: `${COLORS.SUCCESS}30`,
            }}
          >
            <p 
              className="font-semibold"
              style={{ color: COLORS.SUCCESS }}
            >
              ✅ Base légale : Le traitement repose principalement sur votre 
              consentement (article 6.1.a du RGPD) et notre intérêt légitime 
              à améliorer nos services (article 6.1.f du RGPD).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "data-collected",
      article: "ARTICLE 3",
      title: "DONNÉES PERSONNELLES COLLECTÉES",
      content: (
        <div className="space-y-6">
          <p>
            Farm To Fork collecte différentes catégories de données selon votre
            utilisation de la plateforme :
          </p>
          
          {dataCategories.map((category, index) => (
            <div 
              key={category.id}
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h4 
                className="text-lg font-semibold mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Article 3.{index + 1} : {category.title}
              </h4>
              
              <p 
                className="mb-4"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {category.description}
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 
                    className="font-medium mb-2"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    📊 Données collectées
                  </h5>
                  <ul 
                    className="space-y-1 text-sm"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {category.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span 
                          className="w-1 h-1 rounded-full mt-2 flex-shrink-0"
                          style={{ backgroundColor: COLORS.PRIMARY }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h5 
                      className="font-medium mb-1"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      🎯 Finalité
                    </h5>
                    <p 
                      className="text-sm"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {category.purpose}
                    </p>
                  </div>
                  
                  <div>
                    <h5 
                      className="font-medium mb-1"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      ⚖️ Base légale
                    </h5>
                    <p 
                      className="text-sm"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {category.legalBasis}
                    </p>
                  </div>
                  
                  <div>
                    <h5 
                      className="font-medium mb-1"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      ⏰ Conservation
                    </h5>
                    <p 
                      className="text-sm"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {category.retention}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: "data-controller",
      article: "ARTICLE 4",
      title: "RESPONSABLE DU TRAITEMENT",
      content: (
        <div className="space-y-4">
          <div 
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <h4 
              className="font-semibold mb-4"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              👤 Responsable de traitement
            </h4>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 
                  className="font-medium mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  🏢 Entité
                </h5>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  <strong>Farm To Fork</strong><br />
                  Projet individuel de Robin Schmitt
                </p>
              </div>
              
              <div>
                <h5 
                  className="font-medium mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  📧 Contact
                </h5>
                <a
                  href="mailto:info@farmtofork.fr"
                  className={cn(
                    "hover:underline transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                  )}
                  style={{ color: COLORS.PRIMARY }}
                >
                  info@farmtofork.fr
                </a>
              </div>
              
              <div>
                <h5 
                  className="font-medium mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  📍 Adresse
                </h5>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  12 rue des Roses<br />
                  67500 Haguenau, France
                </p>
              </div>
              
              <div>
                <h5 
                  className="font-medium mb-2"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  🛡️ DPO
                </h5>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>
                  Pas de DPO désigné<br />
                  (non obligatoire pour ce type d'activité)
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "user-rights",
      article: "ARTICLE 5",
      title: "VOS DROITS RGPD",
      content: (
        <div className="space-y-6">
          <p>
            Conformément au RGPD, vous disposez des droits suivants concernant
            vos données personnelles :
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {userRights.map((right) => (
              <div 
                key={right.id}
                className="p-4 rounded-lg border"
                style={{
                  backgroundColor: COLORS.BG_WHITE,
                  borderColor: COLORS.BORDER,
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{right.icon}</span>
                  <div>
                    <h5 
                      className="font-semibold mb-1"
                      style={{ color: COLORS.TEXT_PRIMARY }}
                    >
                      {right.title}
                    </h5>
                    <p 
                      className="text-sm"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {right.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
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
              📝 Comment exercer vos droits ?
            </h4>
            <div 
              className="text-sm space-y-2"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <p>
                <strong>1. Par email :</strong>{" "}
                <a
                  href="mailto:info@farmtofork.fr"
                  className="underline hover:no-underline"
                  style={{ color: COLORS.PRIMARY }}
                >
                  info@farmtofork.fr
                </a>
              </p>
              <p>
                <strong>2. Délai de réponse :</strong> 1 mois maximum
              </p>
              <p>
                <strong>3. Pièces requises :</strong> Justificatif d'identité
              </p>
              <p>
                <strong>4. Recours :</strong> En cas de difficulté, contactez la{" "}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                  style={{ color: COLORS.PRIMARY }}
                >
                  CNIL
                </a>
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "security",
      article: "ARTICLE 6",
      title: "SÉCURITÉ DES DONNÉES",
      content: (
        <div className="space-y-4">
          <p>
            Farm To Fork met en œuvre des mesures techniques et organisationnelles
            appropriées pour assurer la sécurité de vos données :
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                title: "Chiffrement",
                icon: "🔐",
                desc: "HTTPS/TLS, mots de passe hachés"
              },
              {
                title: "Hébergement sécurisé",
                icon: "🛡️",
                desc: "Vercel (certifié SOC 2, ISO 27001)"
              },
              {
                title: "Accès restreint",
                icon: "🔑",
                desc: "Authentification multi-facteurs"
              },
              {
                title: "Sauvegardes",
                icon: "💾",
                desc: "Copies automatiques sécurisées"
              },
              {
                title: "Monitoring",
                icon: "👁️",
                desc: "Surveillance des accès suspects"
              },
              {
                title: "Conformité",
                icon: "✅",
                desc: "RGPD, standards de sécurité"
              }
            ].map((measure, index) => (
              <div 
                key={index}
                className="p-3 rounded-lg border"
                style={{
                  backgroundColor: COLORS.BG_WHITE,
                  borderColor: COLORS.BORDER,
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xl">{measure.icon}</span>
                  <h5 
                    className="font-semibold"
                    style={{ color: COLORS.TEXT_PRIMARY }}
                  >
                    {measure.title}
                  </h5>
                </div>
                <p 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {measure.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "policy-updates",
      article: "ARTICLE 7",
      title: "MODIFICATIONS DE LA POLITIQUE",
      content: (
        <div className="space-y-4">
          <p>
            Farm To Fork se réserve le droit de modifier cette politique de
            confidentialité pour rester conforme à la réglementation en vigueur
            ou pour refléter l'évolution de nos services.
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
              📢 Notification des modifications
            </h4>
            <div 
              className="text-sm space-y-1"
              style={{ color: COLORS.TEXT_SECONDARY }}
            >
              <p>• Notification par email pour les changements majeurs</p>
              <p>• Mise à jour de la date en bas de page</p>
              <p>• Conservation des versions antérieures sur demande</p>
              <p>• Possibilité de retirer votre consentement</p>
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
            🔒 Politique de Confidentialité
          </h1>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Transparence totale sur la collecte, l'utilisation et la protection
            de vos données personnelles sur Farm To Fork.
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
          <div className="space-y-12">
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
                  className="text-2xl font-semibold mb-6"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  {section.article} : {section.title}
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
                💬 Questions sur la confidentialité ?
              </h3>
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                Notre équipe est à votre disposition pour répondre à toutes vos
                questions concernant cette politique ou l'exercice de vos droits.
                Contactez-nous à{" "}
                <a 
                  href="mailto:info@farmtofork.fr"
                  className="underline hover:no-underline"
                  style={{ color: COLORS.PRIMARY }}
                >
                  info@farmtofork.fr
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
          <div className="grid md:grid-cols-2 gap-2">
            {policySections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={cn(
                  "p-2 rounded text-sm transition-colors duration-200",
                  "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                )}
                style={{
                  backgroundColor: `${COLORS.PRIMARY}10`,
                  color: COLORS.PRIMARY,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}20`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = `${COLORS.PRIMARY}10`;
                }}
              >
                {section.article} : {section.title}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}