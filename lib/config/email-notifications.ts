"use server";

import { Resend } from "resend";
import { EMAIL_CONFIG, EMAIL_SUBJECTS, EMAIL_BUILDERS } from "./email.config";

// Types TypeScript
export interface FarmerRequest {
  farm_name: string;
  email: string;
  location: string;

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

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Helper pour convertir readonly array en mutable array
 */
const toMutableArray = <T>(readonlyArray: readonly T[]): T[] => {
  return [...readonlyArray];
};

export async function sendAdminNotificationEmail(
  farmerRequest: FarmerRequest
): Promise<EmailResponse> {
  try {
    // Vérifier que les informations nécessaires sont présentes
    if (!farmerRequest || !farmerRequest.farm_name || !farmerRequest.email) {
      throw new Error("Informations de demande incomplètes");
    }

    // Formater la date de manière lisible
    const formattedDate = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // ✅ Construire le contenu avec TOUTES les informations
    const infoRows = [
      // Informations personnelles
      {
        label: "Nom complet",
        value:
          farmerRequest.first_name && farmerRequest.last_name
            ? `${farmerRequest.first_name} ${farmerRequest.last_name}`
            : "Non renseigné",
      },
      { label: "Email", value: farmerRequest.email },
      {
        label: "Téléphone",
        value: farmerRequest.phone || "Non renseigné",
      },

      // Informations entreprise
      {
        label: "SIRET",
        value: farmerRequest.siret || "Non renseigné",
      },
      {
        label: "Département",
        value: farmerRequest.department || "Non renseigné",
      },

      // Informations ferme
      { label: "Nom de la ferme", value: farmerRequest.farm_name },
      { label: "Localisation", value: farmerRequest.location },
    ];

    if (farmerRequest.website) {
      infoRows.push({
        label: "Site web",
        value: `<a href="${farmerRequest.website}" style="color: #2563eb;">${farmerRequest.website}</a>`,
      });
    }

    const htmlContent = EMAIL_BUILDERS.buildContainer(
      EMAIL_BUILDERS.buildHeader(
        "Nouvelle demande d'accès producteur",
        `Reçue le ${formattedDate}`
      ) +
        `<div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px;">
            Une nouvelle demande d'accès producteur vient d'être soumise par 
            <strong>${farmerRequest.first_name} ${farmerRequest.last_name}</strong> 
            pour la ferme <strong>${farmerRequest.farm_name}</strong> 
            et nécessite votre validation.
          </p>
        </div>` +
        `<div style="margin-bottom: 20px;">
          <h2 style="color: #16a34a; font-size: 18px; margin-bottom: 10px;">Détails de la demande</h2>
          ${EMAIL_BUILDERS.buildInfoTable(infoRows)}
        </div>` +
        `<div style="margin-bottom: 20px;">
          <h3 style="color: #16a34a; font-size: 16px; margin-bottom: 10px;">Description</h3>
          <p style="margin: 0; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
            ${farmerRequest.description || "Sera complétée après approbation (Step 2)."}
          </p>
        </div>` +
        (farmerRequest.products
          ? `<div style="margin-bottom: 20px;">
              <h3 style="color: #16a34a; font-size: 16px; margin-bottom: 10px;">Produits proposés</h3>
              <p style="margin: 0; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
                ${farmerRequest.products}
              </p>
            </div>`
          : "") +
        EMAIL_BUILDERS.buildButton(
          "Voir et traiter la demande",
          `${process.env.NEXT_PUBLIC_SITE_URL}/admin/notifications`
        )
    );

    // Envoyer l'email aux administrateurs
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromAddress,
      to: toMutableArray(EMAIL_CONFIG.adminEmails),
      subject: `${EMAIL_SUBJECTS.newFarmerRequest}: ${farmerRequest.farm_name}`,
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
    if (!requestData || !requestData.email || !status) {
      throw new Error("Informations insuffisantes");
    }

    // ✅ Déterminer le contenu basé sur le statut
    let subject: string;
    let heading: string;
    let message: string;
    let ctaText: string;
    let ctaLink: string;

    if (status === "approved") {
      subject = EMAIL_SUBJECTS.farmerRequestApproved;
      heading = "✅ Demande approuvée !";
      message = `
        <p>Bonjour <strong>${requestData.first_name || "Producteur"}</strong>,</p>
        <p>Nous sommes ravis de vous informer que votre demande d'accès producteur pour 
        <strong>${requestData.farm_name}</strong> a été approuvée !</p>
        <p><strong>Prochaines étapes :</strong></p>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>Complétez votre profil de producteur (description, produits, etc.)</li>
          <li>Activez votre fiche ferme</li>
          <li>Commencez à publier vos produits sur Farm to Fork</li>
        </ol>
        <p>Cliquez sur le bouton ci-dessous pour continuer votre inscription.</p>
      `;
      ctaText = "Continuer l'inscription (Step 2)";
      // ✅ CORRECTION : Lien vers step-2, pas add-new-listing
      ctaLink = `${process.env.NEXT_PUBLIC_SITE_URL}/onboarding/step-2`;
    } else {
      subject = EMAIL_SUBJECTS.farmerRequestRejected;
      heading = "❌ Demande non approuvée";
      message = `
        <p>Bonjour <strong>${requestData.first_name || "Producteur"}</strong>,</p>
        <p>Nous avons examiné votre demande d'accès producteur pour 
        <strong>${requestData.farm_name}</strong> et regrettons de vous informer que 
        nous ne pouvons pas l'approuver pour le moment.</p>
        <p><strong>Raisons possibles :</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Informations incomplètes ou incorrectes</li>
          <li>SIRET non valide ou introuvable</li>
          <li>Zone géographique non couverte actuellement</li>
        </ul>
        <p>Si vous pensez qu'il s'agit d'une erreur ou souhaitez obtenir plus d'informations, 
        n'hésitez pas à nous contacter.</p>
      `;
      ctaText = "Contacter le support";
      ctaLink = `${process.env.NEXT_PUBLIC_SITE_URL}/contact`;
    }

    // Construire le contenu HTML
    const htmlContent = EMAIL_BUILDERS.buildContainer(
      EMAIL_BUILDERS.buildHeader(heading) +
        `<div style="background-color: ${
          status === "approved" ? "#f0fdf4" : "#fef2f2"
        }; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          ${message}
        </div>` +
        EMAIL_BUILDERS.buildButton(ctaText, ctaLink) +
        `<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p style="margin: 0;">Vous avez des questions ? Contactez-nous à 
          <a href="mailto:support@farm2fork.fr" style="color: #16a34a; text-decoration: none;">support@farm2fork.fr</a></p>
        </div>`
    );

    // Envoyer l'email au producteur
    const { data, error } = await resend.emails.send({
      from: EMAIL_CONFIG.fromAddress,
      to: requestData.email,
      subject: subject,
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
