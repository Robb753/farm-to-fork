import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

// Récupération des variables d'environnement côté serveur (sans NEXT_PUBLIC)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request) {
  try {
    const { userId, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { error: "userId et role sont requis" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur depuis Clerk
    const user = await clerkClient.users.getUser(userId);
    const email = user?.primaryEmailAddress?.emailAddress;

    if (!email) {
      return NextResponse.json(
        { error: "Adresse email non trouvée pour cet utilisateur" },
        { status: 400 }
      );
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      user_id: userId,
      role,
      email,
      favorites: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      console.error("Erreur création profil:", profileError);
      return NextResponse.json(
        { error: "Erreur lors de la création du profil" },
        { status: 500 }
      );
    }

    // Si rôle = farmer, créer une entrée vide dans listing
    if (role === "farmer") {
      const { error: listingError } = await supabase.from("listing").insert({
        createdBy: email,
        active: false,
        created_at: new Date().toISOString(),
      });

      if (listingError) {
        console.error("Erreur création listing:", listingError);
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
