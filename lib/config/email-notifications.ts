"use server";

import { Resend } from "resend";
import { EMAIL_CONFIG, EMAIL_SUBJECTS, EMAIL_BUILDERS } from "./email.config";

// =======================
// Types TypeScript
// =======================
export interface FarmerRequest {
  farm_name: string;
  email: string;
  location: string;

  // (optionnel mais utile)
  user_id?: string;

  // ✅ Informations personnelles
  first_name?: string;
  last_name?: string;
  phone?: string | null;

  // ✅ Informations entreprise
  siret?: string;
  department?: string;

  // ✅ Informations ferme
  website?: string | null;
  description?: string | null;
  products?: string | null;
}

interface EmailResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// =======================
// Resend client
// =======================
const resend = new Resend(process.env.RESEND_API_KEY);

// =======================
// Helpers
// =======================
/**
 * Convertit readonly array -> mutable array (Resend attend string[])
 */
const toMutableArray = <T>(readonlyArray: readonly T[]): T[] => [
  ...readonlyArray,
];

/**
 * Échappe le HTML pour éviter l’injection dans les emails.
 */
const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/**
 * Valide et normalise une URL (http/https uniquement).
 * Retourne null si invalide / non autorisée.
 */
const safeUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    return u.toString();
  } catch {
    return null;
  }
};

/**
 * Formate une valeur potentiellement null/undefined pour affichage.
 */
const displayValue = (v: unknown): string =>
  typeof v === "string" && v.trim().length > 0
    ? escapeHtml(v.trim())
    : "Non renseigné";

/**
 * Construit un nom complet propre (sans "undefined undefined").
 */
const getFullName = (req: FarmerRequest): string => {
  const first = typeof req.first_name === "string" ? req.first_name.trim() : "";
  const last = typeof req.last_name === "string" ? req.last_name.trim() : "";
  const full = `${first} ${last}`.trim();
  return full.length > 0 ? escapeHtml(full) : "Non renseigné";
};

// =======================
// Emails
// =======================
export async function sendAdminNotificationEmail(
  farmerRequest: FarmerRequest
): Promise<EmailResponse> {
  try {
    if (
      !farmerRequest?.farm_name ||
      !farmerRequest?.email ||
      !farmerRequest?.location
    ) {
      throw new Error(
        "Informations de demande incomplètes (farm_name, email, location requis)"
      );
    }

    // ✅ Date lisible (inclut heure/minute de façon fiable)
    const formattedDate = new Date().toLocaleString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const fullName = getFullName(farmerRequest);

    const safeWebsite =
      typeof farmerRequest.website === "string" && farmerRequest.website.trim()
        ? safeUrl(farmerRequest.website.trim())
        : null;

    // ✅ Construire le contenu avec TOUTES les informations (échappées)
    const infoRows: Array<{ label: string; value: string }> = [
      // Informations personnelles
      { label: "Nom complet", value: fullName },
      { label: "Email", value: displayValue(farmerRequest.email) },
      {
        label: "Téléphone",
        value:
          farmerRequest.phone && farmerRequest.phone.trim().length > 0
            ? escapeHtml(farmerRequest.phone.trim())
            : "Non renseigné",
      },

      // Informations entreprise
      { label: "SIRET", value: displayValue(farmerRequest.siret) },
      { label: "Département", value: displayValue(farmerRequest.department) },

      // Informations ferme
      {
        label: "Nom de la ferme",
        value: displayValue(farmerRequest.farm_name),
      },
      { label: "Localisation", value: displayValue(farmerRequest.location) },
    ];

    if (safeWebsite) {
      infoRows.push({
        label: "Site web",
        value: `<a href="${safeWebsite}" style="color:#2563eb;">${escapeHtml(safeWebsite)}</a>`,
      });
    }

    const farmNameSafe = escapeHtml(farmerRequest.farm_name);
    const descriptionSafe =
      typeof farmerRequest.description === "string" &&
      farmerRequest.description.trim().length > 0
        ? escapeHtml(farmerRequest.description.trim())
        : "Sera complétée après approbation (Step 2).";

    const productsSafe =
      typeof farmerRequest.products === "string" &&
      farmerRequest.products.trim().length > 0
        ? escapeHtml(farmerRequest.products.trim())
        : "";

    const adminUrl = process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/notifications`
      : "/admin/notifications";

    const htmlContent = EMAIL_BUILDERS.buildContainer(
      EMAIL_BUILDERS.buildHeader(
        "Nouvelle demande d'accès producteur",
        `Reçue le ${escapeHtml(formattedDate)}`
      ) +
        `<div style="background-color:#f0fdf4; padding:15px; border-radius:6px; margin-bottom:20px;">
          <p style="margin:0; font-size:16px;">
            Une nouvelle demande d'accès producteur vient d'être soumise par 
            <strong>${fullName}</strong> 
            pour la ferme <strong>${farmNameSafe}</strong> 
            et nécessite votre validation.
          </p>
        </div>` +
        `<div style="margin-bottom:20px;">
          <h2 style="color:#16a34a; font-size:18px; margin-bottom:10px;">Détails de la demande</h2>
          ${EMAIL_BUILDERS.buildInfoTable(infoRows)}
        </div>` +
        `<div style="margin-bottom:20px;">
          <h3 style="color:#16a34a; font-size:16px; margin-bottom:10px;">Description</h3>
          <p style="margin:0; padding:10px; background-color:#f9fafb; border-radius:4px;">
            ${descriptionSafe}
          </p>
        </div>` +
        (productsSafe
          ? `<div style="margin-bottom:20px;">
              <h3 style="color:#16a34a; font-size:16px; margin-bottom:10px;">Produits proposés</h3>
              <p style="margin:0; padding:10px; background-color:#f9fafb; border-radius:4px;">
                ${productsSafe}
              </p>
            </div>`
          : "") +
        EMAIL_BUILDERS.buildButton("Voir et traiter la demande", adminUrl)
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromAddress,
      to: toMutableArray(EMAIL_CONFIG.adminEmails),
      subject: `${EMAIL_SUBJECTS.newFarmerRequest}: ${farmNameSafe}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Erreur d'envoi d'email:", error);
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}

export async function sendFarmerRequestStatusEmail(
  requestData: FarmerRequest,
  status: "approved" | "rejected"
): Promise<EmailResponse> {
  try {
    if (!requestData?.email || !requestData?.farm_name || !status) {
      throw new Error(
        "Informations insuffisantes (email, farm_name, status requis)"
      );
    }

    // ✅ Échappement des données dynamiques affichées
    const safeFirstName =
      typeof requestData.first_name === "string" &&
      requestData.first_name.trim().length > 0
        ? escapeHtml(requestData.first_name.trim())
        : "Producteur";

    const safeFarmName = escapeHtml(requestData.farm_name);

    // ✅ Déterminer le contenu basé sur le statut
    let subject: string;
    let heading: string;
    let message: string;
    let ctaText: string;
    let ctaLink: string;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

    if (status === "approved") {
      subject = EMAIL_SUBJECTS.farmerRequestApproved;
      heading = "✅ Demande approuvée !";
      message = `
        <p>Bonjour <strong>${safeFirstName}</strong>,</p>
        <p>Nous sommes ravis de vous informer que votre demande d'accès producteur pour 
        <strong>${safeFarmName}</strong> a été approuvée !</p>
        <p><strong>Prochaines étapes :</strong></p>
        <ol style="margin:10px 0; padding-left:20px;">
          <li>Complétez votre profil de producteur (description, produits, etc.)</li>
          <li>Activez votre fiche ferme</li>
          <li>Commencez à publier vos produits sur Farm to Fork</li>
        </ol>
        <p>Cliquez sur le bouton ci-dessous pour continuer votre inscription.</p>
      `;
      ctaText = "Continuer l'inscription (Step 2)";
      ctaLink = siteUrl ? `${siteUrl}/onboarding/step-2` : "/onboarding/step-2";
    } else {
      subject = EMAIL_SUBJECTS.farmerRequestRejected;
      heading = "❌ Demande non approuvée";
      message = `
        <p>Bonjour <strong>${safeFirstName}</strong>,</p>
        <p>Nous avons examiné votre demande d'accès producteur pour 
        <strong>${safeFarmName}</strong> et regrettons de vous informer que 
        nous ne pouvons pas l'approuver pour le moment.</p>
        <p><strong>Raisons possibles :</strong></p>
        <ul style="margin:10px 0; padding-left:20px;">
          <li>Informations incomplètes ou incorrectes</li>
          <li>SIRET non valide ou introuvable</li>
          <li>Zone géographique non couverte actuellement</li>
        </ul>
        <p>Si vous pensez qu'il s'agit d'une erreur ou souhaitez obtenir plus d'informations, 
        n'hésitez pas à nous contacter.</p>
      `;
      ctaText = "Contacter le support";
      ctaLink = siteUrl ? `${siteUrl}/contact` : "/contact";
    }

    const htmlContent = EMAIL_BUILDERS.buildContainer(
      EMAIL_BUILDERS.buildHeader(heading) +
        `<div style="background-color:${
          status === "approved" ? "#f0fdf4" : "#fef2f2"
        }; padding:15px; border-radius:6px; margin-bottom:20px;">
          ${message}
        </div>` +
        EMAIL_BUILDERS.buildButton(ctaText, ctaLink) +
        `<div style="margin-top:30px; padding-top:20px; border-top:1px solid #e5e7eb; text-align:center; color:#6b7280; font-size:14px;">
          <p style="margin:0;">Vous avez des questions ? Contactez-nous à 
          <a href="mailto:support@farm2fork.fr" style="color:#16a34a; text-decoration:none;">support@farm2fork.fr</a></p>
        </div>`
    );

    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromAddress,
      to: requestData.email, // email brut OK (pas injecté dans HTML)
      subject,
      html: htmlContent,
    });

    if (error) {
      console.error("Erreur d'envoi d'email:", error);
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email de statut:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erreur inconnue",
    };
  }
}
