import { sendAdminNotificationEmail } from "@/lib/config/email-notifications";
import { NextResponse } from "next/server";


export async function POST(req) {
  try {
    const requestData = await req.json();

    // Vérifier que les données nécessaires sont présentes
    if (!requestData || !requestData.farm_name || !requestData.email) {
      return NextResponse.json(
        { error: "Informations insuffisantes pour envoyer la notification" },
        { status: 400 }
      );
    }

    // Envoyer la notification par email aux administrateurs
    const emailResult = await sendAdminNotificationEmail(requestData);

    if (!emailResult.success) {
      console.error("Erreur d'envoi d'email:", emailResult.error);
      return NextResponse.json(
        { error: "Erreur lors de l'envoi de l'email de notification" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification envoyée avec succès",
    });
  } catch (err) {
    console.error("Erreur de notification:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de l'envoi de la notification" },
      { status: 500 }
    );
  }
}
