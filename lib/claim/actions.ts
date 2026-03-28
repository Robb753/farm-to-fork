"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { rateLimit } from "@/lib/rateLimit";
import type { Database } from "@/lib/types/database";
import {
  sendVerificationCodeEmail,
  sendClaimSuccessEmail,
  sendAdminClaimNotificationEmail,
} from "./emails";

// ─── Supabase service role ───────────────────────────────────────────────────
function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Variables Supabase manquantes");
  return createClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// ─── SHA-256 helper ──────────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Zod schemas ─────────────────────────────────────────────────────────────
const contactSchema = z.object({
  listingId: z.number().int().positive(),
  contactName: z.string().min(2, "Nom requis"),
  contactEmail: z.string().email("Email invalide"),
  contactPhone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^(\+33|0)[1-9](\d{8})$/.test(v.replace(/\s/g, "")),
      "Téléphone invalide (format français)"
    ),
  message: z.string().max(300).optional(),
});

// ─── Action 1 : submitClaimRequest ───────────────────────────────────────────

export type SubmitClaimResult =
  | {
      success: true;
      claimId: number;
      listingName: string;
      contactEmail: string;
      contactPhone: string | null;
      listingSlug: string;
    }
  | { success: false; error: string };

export async function submitClaimRequest(
  formData: FormData
): Promise<SubmitClaimResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Connexion requise" };

  const parsed = contactSchema.safeParse({
    listingId: Number(formData.get("listingId")),
    contactName: formData.get("contactName"),
    contactEmail: formData.get("contactEmail"),
    contactPhone: formData.get("contactPhone") || undefined,
    message: formData.get("message") || undefined,
  });
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message ?? "Données invalides",
    };
  }

  const { listingId, contactName, contactEmail, contactPhone, message } =
    parsed.data;

  // Champs SIRET (pré-vérifiés à l'étape précédente)
  const siret = (formData.get("siret") as string | null)?.trim() || null;
  const siretCompanyName =
    (formData.get("siret_company_name") as string | null)?.trim() || null;

  const supabase = getSupabase();

  // Vérifie listing
  const { data: listing } = await supabase
    .from("listing")
    .select("id, name, slug, osm_id, clerk_user_id")
    .eq("id", listingId)
    .single();

  if (!listing?.osm_id) return { success: false, error: "Ferme non éligible" };
  if (listing.clerk_user_id)
    return { success: false, error: "Ferme déjà revendiquée" };

  // Vérifie qu'aucune demande verified n'existe pour ce listing (par n'importe quel user)
  const { data: existingVerified } = await supabase
    .from("listing_claim_requests")
    .select("id")
    .eq("listing_id", listingId)
    .eq("status", "verified")
    .maybeSingle();
  if (existingVerified)
    return { success: false, error: "Ferme déjà revendiquée" };

  // Upsert (UNIQUE listing_id + user_id) → reset si rejected/expired
  const { data: claim, error: upsertError } = await supabase
    .from("listing_claim_requests")
    .upsert(
      {
        listing_id: listingId,
        clerk_user_id: userId,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone ?? null,
        message: message ?? null,
        status: "pending",
        verification_code: null,
        code_expires_at: null,
        code_attempts: 0,
        verified_at: null,
        ...(siret
          ? {
              siret,
              siret_company_name: siretCompanyName,
              siret_verified: true,
            }
          : {}),
      },
      { onConflict: "listing_id,clerk_user_id" },
    )
    .select("id")
    .single();

  if (upsertError || !claim) {
    console.error("[CLAIM/submit]", upsertError);
    return { success: false, error: "Impossible d'enregistrer la demande" };
  }

  return {
    success: true,
    claimId: claim.id,
    listingName: listing.name ?? "Ferme sans nom",
    contactEmail,
    contactPhone: contactPhone ?? null,
    listingSlug: listing.slug,
  };
}

// ─── Action 2 : sendVerificationCode ─────────────────────────────────────────

export type SendCodeResult =
  | { success: true }
  | { success: false; error: string };

export async function sendVerificationCode(
  claimId: number,
  method: "email" | "sms"
): Promise<SendCodeResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Connexion requise" };

  // Rate limit : 3 envois par claimId par heure
  const rl = rateLimit(`claim-send-code:${claimId}`, {
    maxRequests: 3,
    windowMs: 3_600_000,
  });
  if (!rl.success)
    return {
      success: false,
      error: "Trop de tentatives. Réessayez dans 1 heure.",
    };

  const supabase = getSupabase();

  // Vérifie ownership + état
  const { data: claim } = await supabase
    .from("listing_claim_requests")
    .select("id, clerk_user_id, contact_email, contact_phone, listing_id, status")
    .eq("id", claimId)
    .single();

  if (!claim) return { success: false, error: "Demande introuvable" };
  if (claim.clerk_user_id !== userId) return { success: false, error: "Non autorisé" };
  if (claim.status === "verified") return { success: false, error: "Déjà vérifié" };
  if (claim.status === "rejected") return { success: false, error: "Demande rejetée" };

  // Vérifie SMS disponible
  if (method === "sms") {
    if (!process.env.TWILIO_ACCOUNT_SID)
      return { success: false, error: "SMS non disponible" };
    if (!claim.contact_phone)
      return { success: false, error: "Aucun numéro de téléphone" };
  }

  // Génère code 6 chiffres
  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  const hashedCode = await sha256(code);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Fetch listing name pour l'email
  const { data: listing } = await supabase
    .from("listing")
    .select("name")
    .eq("id", claim.listing_id)
    .single();

  // Update DB
  const { error: updateError } = await supabase
    .from("listing_claim_requests")
    .update({
      verification_method: method,
      verification_code: hashedCode,
      code_expires_at: expiresAt,
      code_attempts: 0,
      status: "code_sent" as const,
    })
    .eq("id", claimId);

  if (updateError) {
    console.error("[CLAIM/sendCode]", updateError);
    return { success: false, error: "Erreur lors de l'envoi" };
  }

  // Envoie selon method
  if (method === "email") {
    const firstName = claim.contact_email?.split("@")[0] ?? "Producteur";
    sendVerificationCodeEmail({
      to: "delivered@resend.dev",
      prenom: firstName,
      farmName: listing?.name ?? "votre ferme",
      code,
    }).catch((err) => console.error("[CLAIM/email]", err));
    console.error("[CLAIM/email] Tentative envoi à:", claim.contact_email);
    console.error("[CLAIM/email] Code (debug only):", code);
    console.error(
      "[CLAIM/email] RESEND_API_KEY présente:",
      !!process.env.RESEND_API_KEY,
    );
  } else {
    // SMS via Twilio (import dynamique — évite l'erreur si non installé)
    try {
      const twilio = (await import("twilio")).default;
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
      );
      client.messages
        .create({
          body: `Votre code Farm2Fork : ${code}. Valable 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER!,
          to: claim.contact_phone!,
        })
        .catch((err: Error) => console.error("[CLAIM/sms]", err));
    } catch (err) {
      console.error("[CLAIM/sms] Twilio non disponible:", err);
    }
  }

  return { success: true };
}

// ─── Action 3 : verifyCode ────────────────────────────────────────────────────

export type VerifyCodeResult =
  | { success: true; listingSlug: string }
  | { success: false; error: string; attemptsLeft?: number };

export async function verifyCode(
  claimId: number,
  code: string
): Promise<VerifyCodeResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Connexion requise" };

  const supabase = getSupabase();

  const { data: claim } = await supabase
    .from("listing_claim_requests")
    .select(
      "id, clerk_user_id, listing_id, status, verification_code, code_expires_at, code_attempts, contact_email, contact_name",
    )
    .eq("id", claimId)
    .single();

  if (!claim) return { success: false, error: "Demande introuvable" };
  if (claim.clerk_user_id !== userId)
    return { success: false, error: "Non autorisé" };
  if (claim.status !== "code_sent")
    return { success: false, error: "Aucun code actif" };
  if (
    !claim.code_expires_at ||
    new Date(claim.code_expires_at) < new Date()
  ) {
    return {
      success: false,
      error: "Code expiré. Veuillez en demander un nouveau.",
    };
  }

  const MAX_ATTEMPTS = 5;
  const attempts = claim.code_attempts ?? 0;

  if (attempts >= MAX_ATTEMPTS) {
    await supabase
      .from("listing_claim_requests")
      .update({ status: "rejected" as const })
      .eq("id", claimId);
    return { success: false, error: "Trop de tentatives. Demande rejetée." };
  }

  // Compare le code
  const hashedInput = await sha256(code.trim());
  if (hashedInput !== claim.verification_code) {
    const newAttempts = attempts + 1;
    await supabase
      .from("listing_claim_requests")
      .update({
        code_attempts: newAttempts,
        ...(newAttempts >= MAX_ATTEMPTS
          ? { status: "rejected" as const }
          : {}),
      })
      .eq("id", claimId);

    if (newAttempts >= MAX_ATTEMPTS) {
      return {
        success: false,
        error: "Trop de tentatives. Demande rejetée.",
        attemptsLeft: 0,
      };
    }
    return {
      success: false,
      error: "Code incorrect.",
      attemptsLeft: MAX_ATTEMPTS - newAttempts,
    };
  }

  // ✓ Code correct — récupère la fiche
  const { data: listing } = await supabase
    .from("listing")
    .select("id, name, slug, active")
    .eq("id", claim.listing_id)
    .single();

  if (!listing) return { success: false, error: "Ferme introuvable" };

  // Marque comme vérifié, efface le code
  await supabase
    .from("listing_claim_requests")
    .update({
      status: "verified" as const,
      verified_at: new Date().toISOString(),
      verification_code: null,
    })
    .eq("id", claimId);

  // Relie la fiche au user + active si inactif
  await supabase
    .from("listing")
    .update({
      clerk_user_id: userId,
      ...(listing.active ? {} : { active: true }),
    })
    .eq("id", listing.id);

  // Met à jour Clerk publicMetadata
  const client = await clerkClient();
  await client.users
    .updateUserMetadata(userId, { publicMetadata: { role: "farmer" } })
    .catch((err: Error) => console.error("[CLAIM/clerk]", err));

  // Emails (fire-and-forget)
  sendClaimSuccessEmail({
    to: "delivered@resend.dev",
    farmName: listing.name ?? "votre ferme",
    listingSlug: listing.slug,
  }).catch((err) => console.error("[CLAIM/success-email]", err));

  sendAdminClaimNotificationEmail({
    farmName: listing.name ?? "Ferme sans nom",
    userEmail: "delivered@resend.dev",
    listingSlug: listing.slug,
  }).catch((err) => console.error("[CLAIM/admin-notif]", err));

  return { success: true, listingSlug: listing.slug };
}

// ─── Action 4 : verifierSiret ─────────────────────────────────────────────────

export type SiretVerificationResult =
  | {
      success: true;
      siret: string;
      companyName: string;
      isAgriculture: boolean;
      isActive: boolean;
    }
  | { success: false; error: string };

export async function verifierSiret(
  siret: string,
  claimId?: number
): Promise<SiretVerificationResult> {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Connexion requise" };

  // Normalise et valide le format
  const normalized = siret.replace(/\s/g, "");
  if (!/^\d{14}$/.test(normalized)) {
    return { success: false, error: "Format SIRET invalide (14 chiffres attendus)" };
  }

  const apiKey = process.env.INSEE_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "Service de vérification temporairement indisponible. Veuillez réessayer dans quelques instants.",
    };
  }

  let inseeData: unknown;
  try {
    const response = await fetch(
      `https://api.insee.fr/api-sirene/3.11/siret/${normalized}`,
      {
        headers: { "X-INSEE-Api-Key-Integration": apiKey },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.status === 404) {
      return { success: false, error: "SIRET introuvable" };
    }

    if (response.status === 403) {
      return { success: false, error: "SIRET introuvable" };
    }

    if (!response.ok) {
      return {
        success: false,
        error: "Service de vérification temporairement indisponible. Veuillez réessayer dans quelques instants.",
      };
    }

    inseeData = await response.json();
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError";
    const isAbort = err instanceof Error && err.name === "AbortError";
    if (isTimeout || isAbort) {
      return {
        success: false,
        error: "Service de vérification temporairement indisponible. Veuillez réessayer dans quelques instants.",
      };
    }
    console.error("[SIRET/fetch]", err);
    return {
      success: false,
      error: "Service de vérification temporairement indisponible. Veuillez réessayer dans quelques instants.",
    };
  }

  // Extrait les données de l'établissement
  const data = inseeData as {
    etablissement: {
      etatAdministratifEtablissement: string;
      uniteLegale: {
        denominationUniteLegale?: string;
        prenomUsuelUniteLegale?: string;
        nomUniteLegale?: string;
        activitePrincipaleUniteLegale?: string;
        etatAdministratifUniteLegale?: string;
      };
    };
  };

  const uniteLegale = data.etablissement.uniteLegale;

  // Nom de l'entreprise : société ou personne physique
  const companyName =
    uniteLegale.denominationUniteLegale ??
    ([uniteLegale.prenomUsuelUniteLegale, uniteLegale.nomUniteLegale]
      .filter(Boolean)
      .join(" ") ||
      "Entreprise non nommée");

  // Vérifie si actif
  const isUniteLegaleActive = uniteLegale.etatAdministratifUniteLegale === "A";
  const isEtablissementActive =
    data.etablissement.etatAdministratifEtablissement === "A";

  if (!isUniteLegaleActive || !isEtablissementActive) {
    return { success: false, error: "Établissement fermé" };
  }

  // Code NAF — agriculture = 01xx ou 03xx
  const nafCode = uniteLegale.activitePrincipaleUniteLegale ?? "";
  const isAgriculture = /^(01|03)/.test(nafCode);

  // Persiste en DB si claimId fourni
  if (claimId) {
    const supabase = getSupabase();
    const { error: updateError } = await supabase
      .from("listing_claim_requests")
      .update({
        siret: normalized,
        siret_verified: true,
        siret_company_name: companyName,
      })
      .eq("id", claimId);

    if (updateError) {
      console.error("[SIRET/update]", updateError);
      // Non-bloquant : on retourne quand même le succès
    }
  }

  return {
    success: true,
    siret: normalized,
    companyName,
    isAgriculture,
    isActive: true,
  };
}
