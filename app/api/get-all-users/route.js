// app/api/get-all-users/route.js
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    if (error) throw error;

    return NextResponse.json({ users: data });
  } catch (err) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs." },
      { status: 500 }
    );
  }
}
