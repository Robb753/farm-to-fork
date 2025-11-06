// config/email-config.ts
// Version TypeScript de votre configuration email existante

export const mailConfigs = {
  // Adresse email d'envoi (celle qui sera vue par les destinataires)
  fromAddress: "notifications@updates.farm2fork.fr",

  // Adresses des administrateurs pour les notifications
  // Type explicite pour compatibilité avec Resend
  adminEmails: [
    "admin@farm2fork.fr",
    // Vous pouvez ajouter plusieurs emails si nécessaire
    // 'autreadmin@farmtofork.fr',
  ] as string[], // ✅ Type mutable pour Resend

  // Configuration des sujets d'emails (pour une centralisation future)
  subjects: {
    newFarmerRequest: "[Action Requise] Nouvelle demande producteur",
    farmerRequestApproved: "Votre demande d'accès producteur a été approuvée !",
    farmerRequestRejected: "❌ Votre demande n'a pas été approuvée", // Correction de la typo
  },
} as const;

// Types TypeScript pour une meilleure sécurité
export type MailConfig = typeof mailConfigs;
export type EmailSubjects = typeof mailConfigs.subjects;