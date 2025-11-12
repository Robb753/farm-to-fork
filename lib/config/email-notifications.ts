"use server";

import { Resend } from "resend";
import { EMAIL_CONFIG, EMAIL_SUBJECTS, EMAIL_BUILDERS } from "./email.config";

// Types TypeScript
interface FarmerRequest {
  farm_name: string;
  email: string;
  location: string;
  phone?: string;
  website?: string;
  description: string;
  products?: string;
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

    // Construire le contenu HTML avec les builders centralisés
    const infoRows = [
      { label: "Nom de la ferme", value: farmerRequest.farm_name },
      { label: "Localisation", value: farmerRequest.location },
      { label: "Email", value: farmerRequest.email },
      { label: "Téléphone", value: farmerRequest.phone || "Non renseigné" },
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
            <strong>${farmerRequest.farm_name}</strong> et nécessite votre validation.
          </p>
        </div>` +
        `<div style="margin-bottom: 20px;">
          <h2 style="color: #16a34a; font-size: 18px; margin-bottom: 10px;">Détails de la demande</h2>
          ${EMAIL_BUILDERS.buildInfoTable(infoRows)}
        </div>` +
        `<div style="margin-bottom: 20px;">
          <h3 style="color: #16a34a; font-size: 16px; margin-bottom: 10px;">Description</h3>
          <p style="margin: 0; padding: 10px; background-color: #f9fafb; border-radius: 4px;">
            ${farmerRequest.description}
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

    // Envoyer l'email aux administrateurs (conversion du type readonly)
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

    // Déterminer le contenu basé sur le statut
    let subject: string;
    let heading: string;
    let message: string;
    let ctaText: string;
    let ctaLink: string;

    if (status === "approved") {
      subject = EMAIL_SUBJECTS.farmerRequestApproved;
      heading = "Demande approuvée";
      message = `
        <p>Nous sommes ravis de vous informer que votre demande d'accès producteur pour 
        <strong>${requestData.farm_name}</strong> a été approuvée !</p>
        <p>Vous pouvez maintenant ajouter votre ferme et commencer à publier vos produits 
        sur la plateforme Farm to Fork.</p>
      `;
      ctaText = "Ajouter votre ferme";
      ctaLink = `${process.env.NEXT_PUBLIC_SITE_URL}/add-new-listing`;
    } else {
      subject = EMAIL_SUBJECTS.farmerRequestRejected;
      heading = "Demande non approuvée";
      message = `
        <p>Nous avons examiné votre demande d'accès producteur pour 
        <strong>${requestData.farm_name}</strong> et regrettons de vous informer que 
        nous ne pouvons pas l'approuver pour le moment.</p>
        <p>Si vous avez des questions ou souhaitez obtenir plus d'informations, 
        n'hésitez pas à nous contacter.</p>
      `;
      ctaText = "Contacter le support";
      ctaLink = `${process.env.NEXT_PUBLIC_SITE_URL}/contact`;
    }

    // Construire le contenu HTML
    const htmlContent = EMAIL_BUILDERS.buildContainer(
      EMAIL_BUILDERS.buildHeader(heading) +
        `<div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          ${message}
        </div>` +
        EMAIL_BUILDERS.buildButton(ctaText, ctaLink)
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
