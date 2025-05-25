import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clerkClient } from "@clerk/nextjs/server";
import { sendFarmerRequestStatusEmail } from "@/lib/email-notifications";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { requestId, userId, role, status } = await req.json();

    if (!requestId || !userId || !role || !status) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // 1. Obtenir les détails de la demande
    const { data: requestData, error: requestError } = await supabase
      .from("farmer_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (requestError) {
      console.error("Erreur de récupération:", requestError);
      return NextResponse.json(
        { error: "Impossible de récupérer les détails de la demande." },
        { status: 500 }
      );
    }

    // 2. Mettre à jour le profil Clerk
    await clerkClient.users.updateUser(userId, {
      publicMetadata: { role },
    });

    // 3. Mettre à jour la table `profiles` (si elle existe)
    await supabase
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    // 4. Mettre à jour la requête
    await supabase
      .from("farmer_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    // 5. Envoyer un email de notification au producteur
    try {
      await sendFarmerRequestStatusEmail(requestData, status);
    } catch (emailError) {
      console.error("Erreur lors de l'envoi de l'email:", emailError);
      // On continue même si l'email échoue
    }

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "Demande approuvée avec succès"
          : "Demande rejetée avec succès",
    });
  } catch (err) {
    console.error("Erreur validation:", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la validation." },
      { status: 500 }
    );
  }
}
