// lib/email/sendFarmerApprovalEmail.ts
import { getResendClient } from "./resendClient";

/**
 * Interface pour les paramètres d'email d'approbation farmer
 */
interface FarmerApprovalEmailParams {
  /** Adresse email du destinataire */
  to: string;
  /** Nom de la ferme approuvée */
  farmName: string;
  /** URL du dashboard (optionnel) */
  dashboardUrl?: string;
}

/**
 * Envoie un email d'approbation à un farmer
 * 
 * @param params - Paramètres de l'email
 * @returns Promise<boolean> - True si envoi réussi, false sinon
 * 
 * @example
 * ```typescript
 * const success = await sendFarmerApprovalEmail({
 *   to: "farmer@example.com",
 *   farmName: "Ferme du Bonheur"
 * });

 */
export async function sendFarmerApprovalEmail(
  params: FarmerApprovalEmailParams
): Promise<boolean> {
  const { to, farmName, dashboardUrl = "https://www.farm2fork.fr/dashboard/farms" } = params;
  
  // Validation des paramètres
  if (!to || !farmName) {
    console.error("[EMAIL] Paramètres manquants pour l'email d'approbation:", { to: !!to, farmName: !!farmName });
    return false;
  }

  // Validation format email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    console.error("[EMAIL] Format email invalide:", to);
    return false;
  }

  const resend = getResendClient();
  if (!resend) {
    console.error("[EMAIL] Client Resend non disponible");
    return false;
  }

  try {
    await resend.emails.send({
      from: "Farm to Fork <no-reply@farm2fork.fr>",
      to,
      subject: "🎉 Votre demande a été approuvée !",
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #22c55e; margin: 0; font-size: 24px;">🎉 Excellente nouvelle !</h1>
            </div>

            <!-- Content -->
            <h2 style="color: #374151; font-size: 18px;">Bonjour,</h2>
            
            <p style="margin: 20px 0;">
              Nous avons le plaisir de vous informer que votre demande pour la ferme 
              <strong style="color: #059669;">${farmName}</strong> a été 
              <span style="color: #22c55e; font-weight: bold;">approuvée</span> ! 
            </p>

            <!-- Call to action box -->
            <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #22c55e;">
              <p style="margin: 0 0 15px 0; font-weight: bold; color: #065f46;">
                Prochaines étapes :
              </p>
              <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                <li>Complétez votre fiche producteur</li>
                <li>Ajoutez vos produits et informations</li>
                <li>Publiez votre listing pour être visible</li>
              </ul>
            </div>

            <p style="margin: 20px 0;">
              Vous pouvez maintenant compléter votre fiche depuis votre tableau de bord.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" 
                 style="display: inline-block; padding: 12px 24px; background-color: #22c55e; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">
                Accéder à mon dashboard
              </a>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Si vous avez des questions, n'hésitez pas à nous contacter.
              </p>
              <p style="margin: 15px 0 0 0; color: #374151;">
                Merci pour votre confiance,<br>
                <strong>L'équipe Farm to Fork</strong> 🌱
              </p>
            </div>

          </div>
        </div>
      `,
    });

    return true;

  } catch (error) {
    console.error("[EMAIL] Erreur lors de l'envoi de l'email d'approbation:", error);
    return false;
  }
}

/**
 * Version simplifiée pour compatibilité avec l'ancien code
 * @deprecated Utiliser sendFarmerApprovalEmail avec l'interface FarmerApprovalEmailParams
 */
export async function sendFarmerApprovalEmailLegacy({
  to,
  farmName
}: {
  to: string;
  farmName: string;
}): Promise<void> {
  await sendFarmerApprovalEmail({ to, farmName });
}

/**
 * Export du type pour utilisation externe
 */
export type { FarmerApprovalEmailParams };