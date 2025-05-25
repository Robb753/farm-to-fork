// config/email-config.js

export const mailConfigs = {
  // Adresse email d'envoi (celle qui sera vue par les destinataires)
  fromAddress: "notifications@updates.farm2fork.fr",

  // Adresses des administrateurs pour les notifications
  adminEmails: [
    "admin@farm2fork.fr",
    // Vous pouvez ajouter plusieurs emails si nécessaire
    // 'autreadmin@farmtofork.fr',
  ],

  // Configuration des sujets d'emails (pour une centralisation future)
  subjects: {
    newFarmerRequest: "[Action Requise] Nouvelle demande producteur",
    farmerRequestApproved: "Votre demande d'accès producteur a été approuvée !",
    farmerRequestRejected: "Mise à jour de votre demande d'accès producteur",
  },
};
