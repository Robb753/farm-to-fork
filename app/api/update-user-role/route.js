// app/api/update-user-role/route.js

import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, role } = body;

    if (!userId || !["user", "farmer"].includes(role)) {
      return NextResponse.json(
        { error: "Paramètres invalides" },
        { status: 400 }
      );
    }

    // Mettre à jour le champ publicMetadata du user dans Clerk
    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        role,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API] Erreur update-user-role:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: error.message },
      { status: 500 }
    );
  }
}
