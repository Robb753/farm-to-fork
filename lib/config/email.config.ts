// lib/config/email.config.ts
// Configuration email centralisée (fusion de config/email-config.js et lib/config/email-notifications.js)

import { COLORS } from "./constants";

// ==================== CONFIGURATION DE BASE ====================

/**
 * Configuration de base pour l'envoi d'emails
 */
export const EMAIL_CONFIG = {
  /**
   * Adresse email d'envoi (celle qui sera vue par les destinataires)
   */
  fromAddress: "notifications@updates.farm2fork.fr",

  /**
   * Nom affiché pour l'expéditeur
   */
  fromName: "Farm to Fork",

  /**
   * Adresses des administrateurs pour les notifications
   */
  adminEmails: [
    "admin@farm2fork.fr",
    // Ajoutez d'autres emails si nécessaire
  ],

  /**
   * Email de réponse (reply-to)
   */
  replyTo: "contact@farm2fork.fr",

  /**
   * Footer par défaut pour tous les emails
   */
  footer: {
    text: "Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.",
    copyright: "Farm to Fork. Tous droits réservés.",
  },
} as const;

// ==================== SUJETS D'EMAILS ====================

/**
 * Sujets des emails (centralisés)
 */
export const EMAIL_SUBJECTS = {
  /**
   * Notification aux admins pour nouvelle demande producteur
   */
  newFarmerRequest: "[Action Requise] Nouvelle demande producteur",

  /**
   * Notification au producteur - demande approuvée
   */
  farmerRequestApproved: "Votre demande d'accès producteur a été approuvée !",

  /**
   * Notification au producteur - demande rejetée
   */
  farmerRequestRejected: "❌ Votre demande n'a pas été approuvée",

  /**
   * Email de bienvenue
   */
  welcome: "Bienvenue sur Farm to Fork !",

  /**
   * Confirmation de création de listing
   */
  listingCreated: "Votre annonce a été publiée avec succès",

  /**
   * Notification de modification de listing
   */
  listingUpdated: "Votre annonce a été mise à jour",
} as const;

// ==================== STYLE EMAIL ====================

/**
 * Styles pour les templates d'emails
 * Utilise les couleurs de constants.ts
 */
export const EMAIL_STYLES = {
  /**
   * Couleurs principales
   */
  colors: {
    primary: COLORS.PRIMARY, // #16a34a
    primaryBg: COLORS.PRIMARY_BG, // #f0fdf4
    border: COLORS.BORDER, // #e5e7eb
    textPrimary: COLORS.TEXT_PRIMARY, // #111827
    textSecondary: COLORS.TEXT_SECONDARY, // #6b7280
    textLight: COLORS.TEXT_LIGHT, // #666
    bgGray: COLORS.BG_GRAY, // #f9fafb
    bgWhite: COLORS.BG_WHITE, // #ffffff
    link: COLORS.LINK, // #2563eb
    success: COLORS.SUCCESS, // #16a34a
    error: COLORS.ERROR, // #dc2626
  },

  /**
   * Dimensions
   */
  dimensions: {
    maxWidth: "600px",
    logoHeight: "50px",
    buttonPadding: "12px 24px",
    borderRadius: "8px",
    borderRadiusSmall: "6px",
    borderRadiusTiny: "4px",
  },

  /**
   * Polices
   */
  fonts: {
    family: "Arial, sans-serif",
    sizes: {
      h1: "24px",
      h2: "18px",
      h3: "16px",
      body: "16px",
      small: "14px",
    },
  },

  /**
   * Espacements
   */
  spacing: {
    section: "20px",
    element: "15px",
    small: "10px",
    tiny: "5px",
  },
} as const;

// ==================== CHEMINS D'ASSETS ====================

/**
 * Chemins des assets pour les emails
 * Note: Utilise process.env.NEXT_PUBLIC_SITE_URL au runtime
 */
export const EMAIL_ASSETS = {
  /**
   * Fonction helper pour obtenir l'URL complète d'un asset
   */
  getAssetUrl: (path: string): string => {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://farm2fork.fr";
    return `${baseUrl}${path}`;
  },

  /**
   * Chemins relatifs des assets
   */
  paths: {
    logo: "/logo.png",
    favicon: "/favicon.ico",
    defaultImage: "/images/default-listing.jpg",
  },
} as const;

// ==================== TEMPLATES D'EMAILS ====================

/**
 * Configuration des templates d'emails
 */
export interface EmailTemplate {
  subject: string;
  preheader?: string;
  includeHeader?: boolean;
  includeFooter?: boolean;
}

export const EMAIL_TEMPLATES = {
  /**
   * Template pour notification admin - nouvelle demande producteur
   */
  adminNewFarmerRequest: {
    subject: EMAIL_SUBJECTS.newFarmerRequest,
    preheader: "Une nouvelle demande d'accès producteur nécessite votre validation",
    includeHeader: true,
    includeFooter: true,
  },

  /**
   * Template pour producteur - demande approuvée
   */
  farmerApproved: {
    subject: EMAIL_SUBJECTS.farmerRequestApproved,
    preheader: "Félicitations ! Vous pouvez maintenant accéder à votre espace producteur",
    includeHeader: true,
    includeFooter: true,
  },

  /**
   * Template pour producteur - demande rejetée
   */
  farmerRejected: {
    subject: EMAIL_SUBJECTS.farmerRequestRejected,
    preheader: "Votre demande d'accès producteur n'a pas été approuvée",
    includeHeader: true,
    includeFooter: true,
  },
} as const;

// ==================== HELPERS DE FORMATAGE ====================

/**
 * Helpers pour formater les données dans les emails
 */
export const EMAIL_FORMATTERS = {
  /**
   * Formater une date de manière lisible en français
   */
  formatDate: (date: Date = new Date()): string => {
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  /**
   * Formater un numéro de téléphone
   */
  formatPhone: (phone?: string): string => {
    if (!phone) return "Non renseigné";
    return phone;
  },

  /**
   * Formater une URL pour affichage
   */
  formatUrl: (url?: string): string => {
    if (!url) return "";
    return url.replace(/^https?:\/\//, "");
  },

  /**
   * Obtenir l'année courante pour le copyright
   */
  getCurrentYear: (): number => {
    return new Date().getFullYear();
  },
} as const;

// ==================== BUILDERS DE TEMPLATES ====================

/**
 * Builders pour construire les templates HTML d'emails
 */
export const EMAIL_BUILDERS = {
  /**
   * Construire le container principal d'un email
   */
  buildContainer: (content: string): string => {
    const { colors, dimensions, fonts, spacing } = EMAIL_STYLES;
    return `
      <div style="
        font-family: ${fonts.family};
        max-width: ${dimensions.maxWidth};
        margin: 0 auto;
        padding: ${spacing.section};
        border: 1px solid ${colors.border};
        border-radius: ${dimensions.borderRadius};
      ">
        ${content}
      </div>
    `;
  },

  /**
   * Construire le header d'un email
   */
  buildHeader: (title: string, subtitle?: string): string => {
    const { colors, dimensions, fonts, spacing } = EMAIL_STYLES;
    const logoUrl = EMAIL_ASSETS.getAssetUrl(EMAIL_ASSETS.paths.logo);

    return `
      <div style="text-align: center; margin-bottom: ${spacing.section};">
        <img src="${logoUrl}" alt="Farm to Fork Logo" style="
          height: ${dimensions.logoHeight};
          margin-bottom: ${spacing.small};
        ">
        <h1 style="
          color: ${colors.primary};
          margin: 0;
          font-size: ${fonts.sizes.h1};
        ">${title}</h1>
        ${subtitle ? `<p style="color: ${colors.textLight}; margin-top: ${spacing.tiny};">${subtitle}</p>` : ""}
      </div>
    `;
  },

  /**
   * Construire un bouton CTA
   */
  buildButton: (text: string, url: string): string => {
    const { colors, dimensions } = EMAIL_STYLES;

    return `
      <div style="text-align: center; margin-top: 30px;">
        <a href="${url}" style="
          display: inline-block;
          background-color: ${colors.primary};
          color: white;
          padding: ${dimensions.buttonPadding};
          text-decoration: none;
          border-radius: ${dimensions.borderRadiusSmall};
          font-weight: bold;
        ">
          ${text}
        </a>
      </div>
    `;
  },

  /**
   * Construire le footer d'un email
   */
  buildFooter: (): string => {
    const { colors, spacing } = EMAIL_STYLES;
    const year = EMAIL_FORMATTERS.getCurrentYear();

    return `
      <div style="
        margin-top: 30px;
        padding-top: ${spacing.section};
        border-top: 1px solid ${colors.border};
        text-align: center;
        color: ${colors.textSecondary};
        font-size: 14px;
      ">
        <p>${EMAIL_CONFIG.footer.text}</p>
        <p>© ${year} ${EMAIL_CONFIG.footer.copyright}</p>
      </div>
    `;
  },

  /**
   * Construire une table d'informations
   */
  buildInfoTable: (rows: Array<{ label: string; value: string }>): string => {
    const { colors } = EMAIL_STYLES;

    const rowsHtml = rows
      .map(
        ({ label, value }) => `
      <tr>
        <td style="
          padding: 8px 0;
          border-bottom: 1px solid ${colors.border};
          width: 30%;
        "><strong>${label}</strong></td>
        <td style="
          padding: 8px 0;
          border-bottom: 1px solid ${colors.border};
        ">${value}</td>
      </tr>
    `
      )
      .join("");

    return `
      <table style="width: 100%; border-collapse: collapse;">
        ${rowsHtml}
      </table>
    `;
  },
} as const;

// ==================== EXPORT GROUPÉ ====================

/**
 * Configuration complète pour les emails
 */
export const MAIL_CONFIG = {
  config: EMAIL_CONFIG,
  subjects: EMAIL_SUBJECTS,
  styles: EMAIL_STYLES,
  assets: EMAIL_ASSETS,
  templates: EMAIL_TEMPLATES,
  formatters: EMAIL_FORMATTERS,
  builders: EMAIL_BUILDERS,
} as const;

// ==================== BACKWARD COMPATIBILITY ====================

/**
 * Export pour compatibilité avec l'ancien config/email-config.js
 * @deprecated Utiliser EMAIL_CONFIG à la place
 */
export const mailConfigs = {
  fromAddress: EMAIL_CONFIG.fromAddress,
  adminEmails: EMAIL_CONFIG.adminEmails,
  subjects: {
    newFarmerRequest: EMAIL_SUBJECTS.newFarmerRequest,
    farmerRequestApproved: EMAIL_SUBJECTS.farmerRequestApproved,
    farmerRequestRejected: EMAIL_SUBJECTS.farmerRequestRejected,
  },
};
