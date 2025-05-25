// app/api/apply-farmer/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Accès serveur uniquement (pas NEXT_PUBLIC)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, email, farmName, phone, location, description } = body;

    if (!userId || !email || !farmName || !phone || !location || !description) {
      return NextResponse.json(
        { error: "Champs requis manquants." },
        { status: 400 }
      );
    }

    // Insérer une demande dans la table farmer_requests (à créer si besoin)
    const { error } = await supabase.from("farmer_requests").insert({
      user_id: userId,
      email,
      farm_name: farmName,
      phone,
      location,
      description,
      status: "pending",
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Erreur insertion Supabase:", error);
      return NextResponse.json(
        { error: "Erreur enregistrement Supabase." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur POST /apply-farmer:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
