import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId invalide" }, { status: 400 });
    }

    const user = await clerkClient.users.getUser(userId);

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const userRole = user.publicMetadata?.role || "undefined";
    const email = user.emailAddresses[0]?.emailAddress || "email inconnu";
    const validRoles = ["user", "farmer"];

    return NextResponse.json({
      success: true,
      userId,
      email,
      role: userRole,
      isValidRole: validRoles.includes(userRole),
      hasRole: !!user.publicMetadata?.role,
      allMetadata: user.publicMetadata || {},
    });
  } catch (error) {
    console.error("[API] Erreur API:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error.message || "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
