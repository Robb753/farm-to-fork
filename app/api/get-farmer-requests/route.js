// app/api/get-farmer-requests/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("farmer_requests")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ requests: data });
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur lors du chargement des demandes." },
      { status: 500 }
    );
  }
}
