// app/view-listing/[id]/page.tsx
import { supabase } from "@/utils/supabase/client";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ViewListing from "./viewlisting";
import type { Database } from "@/lib/types/database";

/**
 * Type pour les paramètres de la page
 */
interface PageParams {
  params: {
    id: string;
  };
}

/**
 * Type pour un listing avec ses images et relations
 */
type ListingWithImages = Database["public"]["Tables"]["listing"]["Row"] & {
  listingImages: Database["public"]["Tables"]["listingImages"]["Row"][];
};

/**
 * Valide et parse l'ID du listing
 */
function validateListingId(id: string): number | null {
  // Vérification que l'ID est un nombre entier positif
  const numericId = parseInt(id, 10);
  
  if (isNaN(numericId) || numericId <= 0 || !Number.isInteger(numericId)) {
    return null;
  }
  
  return numericId;
}

/**
 * Récupère un listing depuis Supabase avec gestion d'erreurs
 */
async function fetchListing(id: number): Promise<ListingWithImages | null> {
  try {
    const { data, error } = await supabase
      .from("listing")
      .select(`
        *,
        listingImages(
          id,
          url,
          listing_id
        )
      `)
      .eq("id", id)
      .eq("active", true) // ✅ Seulement les listings actifs
      .single();

    if (error) {
      console.error("[Supabase ERROR] Failed to fetch listing:", error);
      return null;
    }

    return data as ListingWithImages;
  } catch (error) {
    console.error("[FETCH ERROR] Unexpected error:", error);
    return null;
  }
}

/**
 * Génère les métadonnées pour le SEO
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { id } = params;
  const numericId = validateListingId(id);

  if (!numericId) {
    return {
      title: "Listing non trouvé | Farm To Fork",
      description: "Le listing demandé n'existe pas ou n'est plus disponible.",
    };
  }

  const listing = await fetchListing(numericId);

  if (!listing) {
    return {
      title: "Listing non trouvé | Farm To Fork",
      description: "Le listing demandé n'existe pas ou n'est plus disponible.",
    };
  }

  // ✅ Métadonnées SEO optimisées
  const title = `${listing.name || "Ferme"} - ${listing.address || "France"} | Farm To Fork`;
  const description = listing.description 
    ? `${listing.description.substring(0, 160)}...`
    : `Découvrez ${listing.name || "cette ferme"} située à ${listing.address || "France"}. Produits locaux et de qualité.`;

  const imageUrl = listing.listingImages?.[0]?.url || "/placeholder.png";

  return {
    title,
    description,
    keywords: [
      listing.name,
      listing.address,
      listing.product_type,
      listing.certifications,
      "ferme",
      "producteur local",
      "agriculture",
      "bio",
      "Farm To Fork"
    ].filter(Boolean).join(", "),
    
    // ✅ Open Graph pour réseaux sociaux
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: listing.name || "Image de la ferme",
        },
      ],
      type: "website",
      locale: "fr_FR",
    },
    
    // ✅ Twitter Cards
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
    
    // ✅ Métadonnées structurées pour Google
    other: {
      "og:type": "business.business",
      "business:contact_data:locality": listing.address?.split(",")[0] || "",
      "business:contact_data:region": listing.address?.split(",")[1]?.trim() || "",
    },
  };
}

/**
 * Page de détail d'un listing (Server Component)
 * 
 * Cette page affiche les détails complets d'un listing de ferme avec :
 * - Rendu côté serveur pour SEO optimal
 * - Validation robuste des paramètres
 * - Gestion d'erreurs avec 404 automatique
 * - Métadonnées dynamiques pour partage social
 * - Optimisation des performances avec select spécifique
 * 
 * @param params - Paramètres de la route dynamique [id]
 * @returns JSX.Element | notFound() - Page du listing ou 404
 * 
 * @example
 * URL: /view-listing/123
 * params: { id: "123" }
 */
export default async function ViewListingPage({ params }: PageParams): Promise<JSX.Element> {
  const { id } = params;

  // ✅ Validation stricte de l'ID
  const numericId = validateListingId(id);
  if (!numericId) {
    console.warn(`[VIEW-LISTING] Invalid ID provided: ${id}`);
    notFound();
  }

  // ✅ Récupération sécurisée du listing
  const listing = await fetchListing(numericId);
  if (!listing) {
    console.warn(`[VIEW-LISTING] Listing not found or inactive: ${numericId}`);
    notFound();
  }

  console.log(`✅ [VIEW-LISTING] Successfully loaded listing: ${listing.name} (ID: ${numericId})`);

  // ✅ Rendu du composant client avec données SSR
  return <ViewListing listing={listing} />;
}

/**
 * Configuration de la page pour Next.js
 */
export const dynamic = 'force-dynamic'; // ✅ Toujours fetch fresh data
export const revalidate = 300; // ✅ Revalidate toutes les 5 minutes