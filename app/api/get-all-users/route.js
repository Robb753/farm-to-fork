// app/api/get-all-users/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Sécurité : vérifie que la clé serveur est bien définie
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("La variable SUPABASE_SERVICE_ROLE_KEY est manquante.");
}

// Initialisation du client Supabase côté serveur
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, email, role, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET USERS] Erreur Supabase:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des utilisateurs." },
        { status: 500 }
      );
    }

    return NextResponse.json({ users: data });
  } catch (err) {
    console.error("[GET USERS] Erreur serveur:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur." },
      { status: 500 }
    );
  }
}
