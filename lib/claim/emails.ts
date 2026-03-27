// lib/claim/emails.ts
// Templates Resend pour le tunnel de revendication de fiche.

import { getResendClient, emailConfig } from "@/lib/email/resendClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VerificationCodeEmailParams {
  to: string;
  prenom: string;
  farmName: string;
  code: string;
}

export interface ClaimSuccessEmailParams {
  to: string;
  farmName: string;
  listingSlug: string;
}

export interface AdminClaimNotificationParams {
  farmName: string;
  userEmail: string;
  listingSlug: string;
}

// ─── Email 1 : code de vérification ──────────────────────────────────────────

export async function sendVerificationCodeEmail(
  params: VerificationCodeEmailParams
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { to, prenom, farmName, code } = params;
  // Affiche les 6 chiffres séparés par un espace pour lisibilité
  const codeDisplay = code.split("").join(" ");

  try {
    await resend.emails.send({
      from: emailConfig.defaultFrom,
      to,
      subject: `Votre code Farm2Fork : ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">

            <!-- Header -->
            <div style="background: #059669; padding: 28px 32px;">
              <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">
                🌿 Farm to Fork
              </p>
            </div>

            <!-- Body -->
            <div style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #111827;">Bonjour ${prenom},</p>
              <p style="margin: 0 0 24px; color: #374151;">
                Voici votre code pour revendiquer la fiche
                <strong style="color: #059669;">${farmName}</strong> :
              </p>

              <!-- Code block -->
              <div style="background: #f3f4f6; border-radius: 10px; padding: 24px; text-align: center; margin: 0 0 24px;">
                <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
                  Code de vérification
                </p>
                <p style="margin: 0; font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #111827;">
                  ${codeDisplay}
                </p>
              </div>

              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px;">
                ⏱ Ce code expire dans <strong>10 minutes</strong>.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                Si vous n'avez pas fait cette demande, ignorez cet email.
                Votre fiche ne sera pas modifiée.
              </p>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding: 20px 32px;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                Cordialement,<br>
                <strong style="color: #374151;">L'équipe Farm to Fork</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[CLAIM/email] Erreur envoi code:", err);
    return false;
  }
}

// ─── Email 2 : confirmation de revendication ─────────────────────────────────

export async function sendClaimSuccessEmail(
  params: ClaimSuccessEmailParams
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { to, farmName, listingSlug } = params;
  const farmUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.farm2fork.fr"}/farm/${listingSlug}`;

  try {
    await resend.emails.send({
      from: emailConfig.defaultFrom,
      to,
      subject: `Félicitations ! Votre fiche ${farmName} est revendiquée`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; background: #f9fafb; padding: 40px 20px;">
          <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">

            <!-- Header -->
            <div style="background: #059669; padding: 28px 32px;">
              <p style="margin: 0; color: #ffffff; font-size: 20px; font-weight: bold;">
                🌿 Farm to Fork
              </p>
            </div>

            <!-- Body -->
            <div style="padding: 32px;">
              <!-- Success icon -->
              <div style="text-align: center; margin: 0 0 24px;">
                <div style="display: inline-block; background: #d1fae5; border-radius: 50%; width: 64px; height: 64px; line-height: 64px; font-size: 32px;">
                  ✓
                </div>
              </div>

              <h2 style="margin: 0 0 16px; color: #111827; text-align: center;">
                Revendication réussie !
              </h2>
              <p style="margin: 0 0 16px; color: #374151; text-align: center;">
                Vous êtes maintenant reconnu comme propriétaire de la fiche
                <strong style="color: #059669;">${farmName}</strong>.
              </p>

              <div style="background: #f0fdf4; border-radius: 8px; padding: 16px; margin: 0 0 24px; border-left: 4px solid #059669;">
                <p style="margin: 0; font-weight: bold; color: #065f46;">Prochaines étapes :</p>
                <ul style="margin: 8px 0 0; padding-left: 20px; color: #374151;">
                  <li>Consultez votre fiche publique</li>
                  <li>Complétez vos informations producteur</li>
                  <li>Ajoutez vos produits et horaires</li>
                </ul>
              </div>

              <div style="text-align: center;">
                <a href="${farmUrl}"
                   style="display: inline-block; padding: 12px 28px; background: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 15px;">
                  Voir ma fiche
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="border-top: 1px solid #e5e7eb; padding: 20px 32px;">
              <p style="margin: 0; color: #9ca3af; font-size: 13px;">
                Cordialement,<br>
                <strong style="color: #374151;">L'équipe Farm to Fork</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[CLAIM/email] Erreur envoi confirmation:", err);
    return false;
  }
}

// ─── Email 3 : notification admin ────────────────────────────────────────────

export async function sendAdminClaimNotificationEmail(
  params: AdminClaimNotificationParams
): Promise<boolean> {
  const resend = getResendClient();
  if (!resend) return false;

  const { farmName, userEmail, listingSlug } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.farm2fork.fr";

  try {
    await resend.emails.send({
      from: emailConfig.defaultFrom,
      to: emailConfig.adminEmails,
      subject: `[Farm2Fork] Revendication auto-vérifiée — ${farmName}`,
      html: `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6;">
          <div style="max-width: 520px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #059669; margin: 0 0 16px;">Revendication auto-vérifiée</h2>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 6px; margin: 0 0 16px; border-left: 4px solid #059669;">
              <ul style="margin: 0; padding-left: 20px; color: #374151;">
                <li><strong>Ferme :</strong> ${farmName}</li>
                <li><strong>Email producteur :</strong> ${userEmail}</li>
                <li><strong>Slug :</strong> ${listingSlug}</li>
              </ul>
            </div>
            <p style="color: #374151;">
              La fiche a été revendiquée et activée automatiquement via le tunnel
              de vérification par code. Aucune action admin requise.
            </p>
            <div style="margin-top: 20px;">
              <a href="${siteUrl}/farm/${listingSlug}"
                 style="display: inline-block; padding: 10px 20px; background: #059669; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-right: 12px;">
                Voir la fiche
              </a>
              <a href="${siteUrl}/admin/requests"
                 style="display: inline-block; padding: 10px 20px; background: #6b7280; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Dashboard admin
              </a>
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
              Notification automatique — Farm to Fork
            </p>
          </div>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("[CLAIM/email] Erreur envoi notif admin:", err);
    return false;
  }
}
