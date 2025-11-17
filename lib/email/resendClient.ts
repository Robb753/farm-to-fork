// lib/email/resendClient.ts
import { Resend } from "resend";

/**
 * Configuration email centralisée pour l'application
 */
interface EmailConfig {
  apiKey: string | undefined;
  defaultFrom: string;
  adminEmails: string[];
}

/**
 * Configuration email avec validation
 */
const emailConfig: EmailConfig = {
  apiKey: process.env.RESEND_API_KEY,
  defaultFrom: "Farm to Fork <no-reply@farm2fork.fr>",
  adminEmails: [
    "admin@farm2fork.fr",
    // Ajouter d'autres emails admin si nécessaire
  ],
};

/**
 * Singleton pour le client Resend
 * Évite les instanciations multiples
 */
let resendInstance: Resend | null = null;

/**
 * Factory pour obtenir le client Resend configuré
 *
 * @returns Instance Resend ou null si pas de clé API
 */
export function getResendClient(): Resend | null {
  if (!emailConfig.apiKey) {
    console.warn(
      "[EMAIL] RESEND_API_KEY manquante. Les emails ne seront pas envoyés."
    );
    return null;
  }

  // Singleton pattern
  if (!resendInstance) {
    resendInstance = new Resend(emailConfig.apiKey);
  }

  return resendInstance;
}

/**
 * Interface pour les paramètres d'email farmer
 */
export interface FarmerApprovalEmailParams {
  to: string;
  farmName: string;
  dashboardUrl?: string;
}

/**
 * Interface pour les paramètres d'email admin
 */
export interface AdminNotificationParams {
  subject: string;
  farmName: string;
  userEmail: string;
  requestId: number;
}

/**
 * Envoie un email d'approbation à un farmer
 */
export async function sendFarmerApprovalEmail(
  params: FarmerApprovalEmailParams
): Promise<boolean> {
  const resend = getResendClient();

  if (!resend || !params.to || !params.farmName) {
    console.error("[EMAIL] Paramètres manquants pour l'email d'approbation");
    return false;
  }

  const dashboardUrl =
    params.dashboardUrl || "https://www.farm2fork.fr/dashboard/farms";

  try {
    await resend.emails.send({
      from: emailConfig.defaultFrom,
      to: params.to,
      subject: "🎉 Votre demande a été approuvée !",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #22c55e;">Excellente nouvelle !</h2>
            
            <p>Bonjour,</p>
            
            <p>Nous avons le plaisir de vous informer que votre demande pour la ferme <strong style="color: #059669;">${params.farmName}</strong> a été <span style="color: #22c55e; font-weight: bold;">approuvée</span> ! 🎉</p>
            
            <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0;"><strong>Prochaines étapes :</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Complétez votre fiche producteur</li>
                <li>Ajoutez vos produits et informations</li>
                <li>Publiez votre listing</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Accéder à mon dashboard
              </a>
            </div>
            
            <p>Si vous avez des questions, n'hésitez pas à nous contacter.</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Merci pour votre confiance,<br>
              <strong>L'équipe Farm to Fork</strong>
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[EMAIL] Erreur envoi email d'approbation:", error);
    return false;
  }
}

/**
 * Envoie une notification aux admins pour une nouvelle demande farmer
 */
export async function sendAdminNotificationEmail(
  params: AdminNotificationParams
): Promise<boolean> {
  const resend = getResendClient();

  if (!resend) {
    console.error("[EMAIL] Client Resend non disponible");
    return false;
  }

  try {
    await resend.emails.send({
      from: emailConfig.defaultFrom,
      to: emailConfig.adminEmails,
      subject: `[Action Requise] Nouvelle demande producteur - ${params.farmName}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #f59e0b;">Nouvelle demande producteur</h2>
            
            <div style="background-color: #fffbeb; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 0; font-weight: bold;">Détails de la demande :</p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Ferme :</strong> ${params.farmName}</li>
                <li><strong>Email :</strong> ${params.userEmail}</li>
                <li><strong>ID Demande :</strong> #${params.requestId}</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://www.farm2fork.fr/admin/farmer-requests" 
                 style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Examiner la demande
              </a>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              Cette notification a été envoyée automatiquement par le système Farm to Fork.
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[EMAIL] Erreur envoi notification admin:", error);
    return false;
  }
}

/**
 * Utilitaire pour envoyer un email de rejet
 */
export async function sendFarmerRejectionEmail(
  to: string,
  farmName: string,
  reason?: string
): Promise<boolean> {
  const resend = getResendClient();

  if (!resend || !to || !farmName) {
    console.error("[EMAIL] Paramètres manquants pour l'email de rejet");
    return false;
  }

  try {
    await resend.emails.send({
      from: emailConfig.defaultFrom,
      to,
      subject: "❌ Mise à jour de votre demande producteur",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #dc2626;">Mise à jour de votre demande</h2>
            
            <p>Bonjour,</p>
            
            <p>Nous vous remercions pour votre demande concernant la ferme <strong>${farmName}</strong>.</p>
            
            <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0;">Malheureusement, nous ne pouvons pas donner suite à votre demande à ce stade.</p>
              ${reason ? `<p style="margin: 10px 0 0 0;"><strong>Raison :</strong> ${reason}</p>` : ""}
            </div>
            
            <p>N'hésitez pas à soumettre une nouvelle demande si votre situation évolue.</p>
            
            <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px;">
              Cordialement,<br>
              <strong>L'équipe Farm to Fork</strong>
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (error) {
    console.error("[EMAIL] Erreur envoi email de rejet:", error);
    return false;
  }
}

/**
 * Export des configurations pour utilisation externe
 */
export { emailConfig };
