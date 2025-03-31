// app/api/check-user-role/route.js
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    console.log(`[API] Vérification du rôle pour userId=${userId}`);

    if (!userId || typeof userId !== "string") {
      return NextResponse.json({ error: "userId invalide" }, { status: 400 });
    }

    try {
      const user = await clerkClient.users.getUser(userId);

      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }

      const userRole = user.publicMetadata?.role || "undefined";
      const validRoles = ["user", "farmer"];
      const isValidRole = validRoles.includes(userRole);
      const email = user.emailAddresses[0]?.emailAddress || "email inconnu";

      console.log(`[API] Rôle actuel pour ${email}: ${userRole}`);

      return NextResponse.json(
        {
          success: true,
          userId,
          email,
          role: userRole,
          isValidRole,
          hasRole: !!user.publicMetadata?.role,
          allMetadata: user.publicMetadata || {},
        },
        { status: 200 }
      );
    } catch (clerkError) {
      console.error("[API] Erreur Clerk lors de la vérification:", clerkError);

      return NextResponse.json(
        {
          error: "Erreur Clerk",
          details: clerkError.message || "Pas de détails",
          code: clerkError.code || "UNKNOWN",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[API] Erreur générale:", error);

    return NextResponse.json(
      {
        error: "Erreur générale",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
