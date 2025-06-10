import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clerkClient } from "@clerk/nextjs/server";
import { sendFarmerRequestStatusEmail } from "@/lib/config/email-notifications";

// 🔐 Initialisation sécurisée de Supabase (clé SERVICE_ROLE)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
  throw new Error("Clé Supabase manquante dans l'environnement");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { requestId, userId, role, status } = await req.json();

    console.log("✅ [VALIDATE] Données reçues :", {
      requestId,
      userId,
      role,
      status,
    });

    if (!requestId || !userId || !role || !status) {
      return NextResponse.json(
        { error: "Paramètres requis manquants." },
        { status: 400 }
      );
    }

    const numericRequestId = Number(requestId);
    if (isNaN(numericRequestId)) {
      console.warn("[VALIDATE] ❌ ID de demande non numérique :", requestId);
      return NextResponse.json(
        { error: "ID de la demande invalide" },
        { status: 400 }
      );
    }

    // 1. Récupération de la demande
    const { data: requestData, error: requestError } = await supabase
      .from("farmer_requests")
      .select("*")
      .eq("id", numericRequestId)
      .single();

    if (requestError || !requestData) {
      console.error("[VALIDATE] ❌ Demande introuvable :", requestError);
      return NextResponse.json(
        { error: "Demande introuvable." },
        { status: 404 }
      );
    }

    // 2. Mise à jour du rôle Clerk
    try {
      await clerkClient.users.updateUser(userId, {
        publicMetadata: { role },
      });
    } catch (err) {
      console.error("[VALIDATE] ❌ Clerk update error:", err);
      return NextResponse.json(
        { error: "Échec mise à jour Clerk." },
        { status: 500 }
      );
    }

    // 3. Mise à jour du rôle dans Supabase (profil)
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (profileUpdateError) {
      console.error("[VALIDATE] ❌ Erreur update profil:", profileUpdateError);
      return NextResponse.json(
        { error: "Échec de mise à jour du profil." },
        { status: 500 }
      );
    }

    // 4. Mise à jour de la demande (statut + timestamp)
    const { error: requestUpdateError } = await supabase
      .from("farmer_requests")
      .update({
        status,
        updated_at: new Date().toISOString(),
        approved_by_admin_at:
          status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", numericRequestId);

    if (requestUpdateError) {
      console.error("[VALIDATE] ❌ Erreur update demande:", requestUpdateError);
      return NextResponse.json(
        { error: "Échec de la mise à jour de la demande." },
        { status: 500 }
      );
    }

    // 5. Création automatique du listing si approuvé
    if (status === "approved") {
      const {
        farm_name,
        location,
        description,
        phone,
        website,
        email,
        products,
      } = requestData;

      const { data: listingData, error: insertListingError } = await supabase
        .from("listing")
        .insert([
          {
            createdBy: userId,
            name: farm_name,
            description,
            phoneNumber: phone,
            email,
            website,
            address: location,
            product_type: products ?? null,
            status: "draft", // ou "incomplete" si tu veux une étape supplémentaire
          },
        ])
        .select("id")
        .single();

      if (insertListingError) {
        console.error(
          "[VALIDATE] ❌ Erreur création fiche producteur:",
          insertListingError
        );
        return NextResponse.json(
          { error: "Fiche producteur non créée." },
          { status: 500 }
        );
      }

      console.log("✅ [VALIDATE] Listing créé avec ID :", listingData.id);

      // 6. Mise à jour du profil avec farm_id
      const { error: profileLinkError } = await supabase
        .from("profiles")
        .update({ farm_id: listingData.id })
        .eq("user_id", userId);

      if (profileLinkError) {
        console.error(
          "[VALIDATE] ❌ Erreur update farm_id dans profil :",
          profileLinkError
        );
        // ⚠️ pas bloquant pour l'instant
      }
    }

    // 7. Envoi de l’email de statut au producteur
    try {
      await sendFarmerRequestStatusEmail(requestData, status);
      console.log("📧 [VALIDATE] Email de statut envoyé avec succès");
    } catch (err) {
      console.warn("[VALIDATE] ⚠️ Email non envoyé :", err);
      // Non bloquant
    }

    return NextResponse.json({
      success: true,
      message:
        status === "approved"
          ? "Demande approuvée avec succès."
          : "Demande rejetée avec succès.",
    });
  } catch (err) {
    console.error("[VALIDATE] ❌ Erreur serveur inconnue :", err);
    return NextResponse.json(
      { error: "Erreur interne lors de la validation." },
      { status: 500 }
    );
  }
}
