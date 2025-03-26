import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client"; // Ajustez le chemin selon votre structure

export async function POST(request) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId et role sont requis" },
        { status: 400 }
      );
    }

    // Récupérer les données de l'utilisateur depuis Clerk
    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const email = user.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "Adresse email non trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    // Créer une entrée dans la table profiles avec le rôle approprié
    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      role: role,
      email: email,
      favorites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Erreur lors de la création du profil:", profileError);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil" },
        { status: 500 }
      );
    }

    // Si c'est un farmer, créer aussi une entrée vide dans listing
    if (role === "farmer") {
      const { error: listingError } = await supabase.from("listing").insert({
        createdBy: email,
        active: false,
        created_at: new Date().toISOString(),
      });

      if (listingError) {
        console.error("Erreur lors de la création du listing:", listingError);
        return NextResponse.json(
          { error: "Erreur lors de la création du listing" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur serveur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du profil" },
      { status: 500 }
    );
  }
}
