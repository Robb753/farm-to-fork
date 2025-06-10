// app/api/get-listings/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialise un client Supabase sécurisé côté serveur
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    // Récupère toutes les fermes actives
    const { data, error } = await supabase
      .from("listing")
      .select("id, created_at, createdBy, coordinates, active")
      .eq("active", true);

    if (error) {
      console.error("[API] Erreur Supabase:", error.message);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des listings." },
        { status: 500 }
      );
    }

    return NextResponse.json({ listings: data });
  } catch (err) {
    console.error("[API] Erreur serveur:", err.message);
    return NextResponse.json(
      { error: "Erreur serveur inattendue." },
      { status: 500 }
    );
  }
}
