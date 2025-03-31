// app/api/update-user-role/route.js
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const body = await req.json();
    const { userId, role, emergency } = body;

    const allowedRoles = ["user", "farmer"];
    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide ou manquant" },
        { status: 400 }
      );
    }

    if (emergency) {
      console.log(
        `[API-EMERGENCY] Demande prioritaire de mise à jour du rôle: ${role} pour ${userId}`
      );
    }

    console.log(
      `API: Tentative de mise à jour du rôle pour userId=${userId} vers role=${role}`
    );

    // Vérifier que l'utilisateur existe
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const currentRole = user.publicMetadata?.role;
    const email = user.emailAddresses[0]?.emailAddress || "email inconnu";

    console.log(
      `API: Utilisateur trouvé: ${email} | Rôle actuel: ${
        currentRole || "non défini"
      }`
    );

    // Mise à jour des métadonnées publiques
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        role,
        updatedAt: new Date().toISOString(),
        emergency: !!emergency,
      },
    });

    console.log(`✅ API: Mise à jour réussie pour ${email} (userId=${userId})`);

    // Vérification après mise à jour
    const updatedUser = await clerkClient.users.getUser(userId);
    const updatedRole = updatedUser.publicMetadata?.role;

    console.log(
      `🔍 API: Vérification post-mise à jour | Rôle = ${updatedRole}`
    );

    if (updatedRole !== role) {
      console.warn(
        `⚠️ Désynchronisation détectée: attendu=${role}, trouvé=${updatedRole}`
      );

      return NextResponse.json(
        {
          success: false,
          desync: true,
          message:
            "Rôle mis à jour, mais pas encore visible dans les métadonnées",
          expectedRole: role,
          actualRole: updatedRole,
        },
        { status: 202 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Rôle mis à jour avec succès",
        verifiedRole: updatedRole,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ API: Erreur générale:", error);

    return NextResponse.json(
      {
        error: "Erreur lors du traitement de la requête",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
