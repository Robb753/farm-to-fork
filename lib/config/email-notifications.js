"use server";

import { Resend } from "resend";
import { mailConfigs } from "@/config/email-config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAdminNotificationEmail(farmerRequest) {
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

    // Construire le contenu HTML de l'email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="Farm to Fork Logo" style="height: 50px; margin-bottom: 10px;">
          <h1 style="color: #16a34a; margin: 0; font-size: 24px;">Nouvelle demande d'accès producteur</h1>
          <p style="color: #666; margin-top: 5px;">Reçue le ${formattedDate}</p>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          <p style="margin: 0; font-size: 16px;">Une nouvelle demande d'accès producteur vient d'être soumise par <strong>${farmerRequest.farm_name}</strong> et nécessite votre validation.</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #16a34a; font-size: 18px; margin-bottom: 10px;">Détails de la demande</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb; width: 30%;"><strong>Nom de la ferme</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${farmerRequest.farm_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Localisation</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${farmerRequest.location}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Email</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${farmerRequest.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Téléphone</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">${farmerRequest.phone || "Non renseigné"}</td>
            </tr>
            ${
              farmerRequest.website
                ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><strong>Site web</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;"><a href="${farmerRequest.website}" style="color: #2563eb;">${farmerRequest.website}</a></td>
            </tr>
            `
                : ""
            }
          </table>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #16a34a; font-size: 16px; margin-bottom: 10px;">Description</h3>
          <p style="margin: 0; padding: 10px; background-color: #f9fafb; border-radius: 4px;">${farmerRequest.description}</p>
        </div>
        
        ${
          farmerRequest.products
            ? `
        <div style="margin-bottom: 20px;">
          <h3 style="color: #16a34a; font-size: 16px; margin-bottom: 10px;">Produits proposés</h3>
          <p style="margin: 0; padding: 10px; background-color: #f9fafb; border-radius: 4px;">${farmerRequest.products}</p>
        </div>
        `
            : ""
        }
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/notifications" 
             style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Voir et traiter la demande
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>© ${new Date().getFullYear()} Farm to Fork. Tous droits réservés.</p>
        </div>
      </div>
    `;

    // Envoyer l'email aux administrateurs
    const { data, error } = await resend.emails.send({
      from: mailConfigs.fromAddress,
      to: mailConfigs.adminEmails,
      subject: `[Action Requise] Nouvelle demande producteur: ${farmerRequest.farm_name}`,
      html: htmlContent,
    });

    if (error) {
      console.error("Erreur d'envoi d'email:", error);
      throw new Error(error.message);
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    return { success: false, error: error.message };
  }
}

export async function sendFarmerRequestStatusEmail(requestData, status) {
  try {
    if (!requestData || !requestData.email || !status) {
      throw new Error("Informations insuffisantes");
    }

    // Déterminer le contenu basé sur le statut
    let subject, heading, message, ctaText, ctaLink;

    if (status === "approved") {
      subject = mailConfigs.subjects.farmerRequestApproved;
      heading = "Demande approuvée";
      message = `
        <p>Nous sommes ravis de vous informer que votre demande d'accès producteur pour <strong>${requestData.farm_name}</strong> a été approuvée !</p>
        <p>Vous pouvez maintenant ajouter votre ferme et commencer à publier vos produits sur la plateforme Farm to Fork.</p>
      `;
      ctaText = "Ajouter votre ferme";
      ctaLink = `${process.env.NEXT_PUBLIC_SITE_URL}/add-new-listing`;
    } else {
      subject = mailConfigs.subjects.farmerRequestRejected;
      heading = "Demande non approuvée";
      message = `
        <p>Nous avons examiné votre demande d'accès producteur pour <strong>${requestData.farm_name}</strong> et regrettons de vous informer que nous ne pouvons pas l'approuver pour le moment.</p>
        <p>Si vous avez des questions ou souhaitez obtenir plus d'informations, n'hésitez pas à nous contacter.</p>
      `;
      ctaText = "Contacter le support";
      ctaLink = `${process.env.NEXT_PUBLIC_SITE_URL}/contact`;
    }

    // Construire le contenu HTML de l'email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="${process.env.NEXT_PUBLIC_SITE_URL}/logo.png" alt="Farm to Fork Logo" style="height: 50px; margin-bottom: 10px;">
          <h1 style="color: #16a34a; margin: 0; font-size: 24px;">${heading}</h1>
        </div>
        
        <div style="background-color: #f0fdf4; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
          ${message}
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${ctaLink}" 
             style="display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            ${ctaText}
          </a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
          <p>Cet e-mail a été envoyé automatiquement, merci de ne pas y répondre.</p>
          <p>© ${new Date().getFullYear()} Farm to Fork. Tous droits réservés.</p>
        </div>
      </div>
    `;

    // Envoyer l'email au producteur
    const { data, error } = await resend.emails.send({
      from: mailConfigs.fromAddress,
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
    return { success: false, error: error.message };
  }
}
