// app/api/producer-request/route.ts
// Unified endpoint for both farm creation requests (type:"create")
// and OSM listing claim requests (type:"claim").

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { z } from "zod";
import type { Database } from "@/lib/types/database";
import { rateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { sendAdminNotificationEmail } from "@/lib/config/email-notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------
function createSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes");
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const createSchema = z.object({
  type: z.literal("create"),
  email: z.string().email("Email invalide"),
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  farmName: z.string().min(1, "Nom de la ferme requis"),
  siret: z
    .string()
    .transform((v) => v.replace(/\s/g, ""))
    .pipe(z.string().regex(/^\d{14}$/, "SIRET doit contenir 14 chiffres")),
  location: z.string().min(1, "Localisation requise"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().optional(),
});

const claimSchema = z.object({
  type: z.literal("claim"),
  listingId: z.number().int().positive("listingId doit être un entier positif"),
});

const bodySchema = z.discriminatedUnion("type", [createSchema, claimSchema]);

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Non authentifié", message: "Connexion requise" },
      { status: 401 }
    );
  }

  // Parse body
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "JSON invalide", message: "Corps de requête invalide" },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Données invalides",
        message: parsed.error.errors.map((e) => e.message).join(", "),
      },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const supabase = createSupabaseClient();

  // -------------------------------------------------------------------------
  // CREATE flow
  // -------------------------------------------------------------------------
  if (body.type === "create") {
    // Rate limit
    const rl = rateLimit(`onboarding:${userId}`, RATE_LIMITS.onboarding);
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: "Trop de requêtes", message: "Réessayez dans quelques minutes." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
        }
      );
    }

    // Resolve email from Clerk (authoritative) or body
    const clerkUser = await currentUser();
    const resolvedEmail = (
      clerkUser?.primaryEmailAddress?.emailAddress ?? body.email
    )
      .trim()
      .toLowerCase();

    // Duplicate check — any non-rejected create request
    const { data: existing } = await supabase
      .from("producer_requests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("type", "create")
      .neq("status", "rejected")
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: "Candidature existante",
          message: "Vous avez déjà une candidature en cours",
        },
        { status: 409 }
      );
    }

    const { data: inserted, error: insertError } = await supabase
      .from("producer_requests")
      .insert({
        type: "create",
        user_id: userId,
        user_email: resolvedEmail,
        user_name: [body.firstName.trim(), body.lastName.trim()]
          .filter(Boolean)
          .join(" ") || null,
        first_name: body.firstName.trim(),
        last_name: body.lastName.trim(),
        phone: body.phone?.trim() || null,
        farm_name: body.farmName.trim(),
        siret: body.siret,
        location: body.location.trim(),
        lat: body.lat,
        lng: body.lng,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[PRODUCER-REQUEST/create] Erreur insertion:", insertError);
      if (insertError?.code === "23505") {
        return NextResponse.json(
          { success: false, error: "Candidature existante", message: "Une candidature existe déjà" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { success: false, error: "Erreur BDD", message: "Impossible d'enregistrer la demande" },
        { status: 500 }
      );
    }

    // Fire-and-forget admin email
    sendAdminNotificationEmail({
      farm_name: body.farmName.trim(),
      email: resolvedEmail,
      location: body.location.trim(),
      user_id: userId,
      first_name: body.firstName.trim(),
      last_name: body.lastName.trim(),
      phone: body.phone?.trim() || null,
      siret: body.siret,
    }).catch((err) => console.error("[PRODUCER-REQUEST/create] Email admin:", err));

    return NextResponse.json(
      {
        success: true,
        message: "Votre demande a été soumise. Vous recevrez une réponse sous 24-48h.",
        requestId: inserted.id,
      },
      { status: 201 }
    );
  }

  // -------------------------------------------------------------------------
  // CLAIM flow
  // -------------------------------------------------------------------------
  // Rate limit
  const rl = rateLimit(`claim-farm:${userId}`, RATE_LIMITS.claimFarm);
  if (!rl.success) {
    return NextResponse.json(
      { success: false, error: "Trop de requêtes", message: "Réessayez dans un moment." },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil((rl.resetAt - Date.now()) / 1000)) },
      }
    );
  }

  const { listingId } = body;

  // Verify listing exists, has osm_id, not yet claimed
  const { data: listing, error: listingError } = await supabase
    .from("listing")
    .select("id, osm_id, clerk_user_id, name, address")
    .eq("id", listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { success: false, error: "Ferme introuvable", message: "Ce listing n'existe pas" },
      { status: 404 }
    );
  }

  if (!listing.osm_id) {
    return NextResponse.json(
      {
        success: false,
        error: "Non éligible",
        message: "Seules les fermes pré-enregistrées depuis OSM peuvent être revendiquées",
      },
      { status: 400 }
    );
  }

  if (listing.clerk_user_id) {
    return NextResponse.json(
      {
        success: false,
        error: "Déjà revendiquée",
        message: "Cette ferme a déjà été revendiquée par un autre utilisateur",
      },
      { status: 409 }
    );
  }

  // Duplicate check for this user + listing (allow re-submit after rejection)
  const { data: existingClaim } = await supabase
    .from("producer_requests")
    .select("id, status")
    .eq("listing_id", listingId)
    .eq("user_id", userId)
    .single();

  if (existingClaim) {
    if (existingClaim.status === "pending" || existingClaim.status === "approved") {
      return NextResponse.json(
        {
          success: false,
          error: "Demande existante",
          message:
            existingClaim.status === "pending"
              ? "Vous avez déjà une demande en attente pour cette ferme"
              : "Votre demande de revendication a déjà été approuvée",
        },
        { status: 409 }
      );
    }
    // Rejected — delete old entry to allow resubmission
    await supabase.from("producer_requests").delete().eq("id", existingClaim.id);
  }

  // Fetch Clerk user info
  const clerkClientInstance = await clerkClient();
  const clerkUser = await clerkClientInstance.users.getUser(userId);
  const userEmail =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    "";
  const userName =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
    null;

  const { data: newRequest, error: insertError } = await supabase
    .from("producer_requests")
    .insert({
      type: "claim",
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      listing_id: listingId,
      status: "pending",
    })
    .select("id")
    .single();

  if (insertError || !newRequest) {
    console.error("[PRODUCER-REQUEST/claim] Erreur insertion:", insertError);
    return NextResponse.json(
      { success: false, error: "Erreur BDD", message: "Impossible de soumettre la demande" },
      { status: 500 }
    );
  }

  // Fire-and-forget admin email — même pattern que le flow "create"
  sendAdminNotificationEmail({
    farm_name: listing.name ?? "Ferme sans nom",
    email: userEmail,
    location: listing.address ?? "",
    user_id: userId,
    first_name: clerkUser.firstName ?? undefined,
    last_name: clerkUser.lastName ?? undefined,
  }).catch((err) => console.error("[PRODUCER-REQUEST/claim] Email admin:", err));

  return NextResponse.json({
    success: true,
    message: `Demande soumise pour la ferme "${listing.name ?? "Sans nom"}". Un administrateur va examiner votre demande.`,
    requestId: newRequest.id,
  });
}
