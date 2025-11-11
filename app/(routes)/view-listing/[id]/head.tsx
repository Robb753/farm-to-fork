// lib/seo/generateListingMetadata.ts
import type { Metadata } from "next";
import { supabase } from "@/utils/supabase/client";
import type { Database } from "@/lib/types/database";

/**
 * Type pour les paramètres de la route
 */
interface MetadataParams {
  params: {
    id: string;
  };
}

/**
 * Type pour un listing avec images pour les métadonnées
 */
type ListingForMetadata = {
  id: number;
  name: string;
  address: string;
  description: string | null;
  listingImages: { url: string }[];
};

/**
 * Génère les métadonnées SEO optimisées pour un listing
 *
 * Cette fonction récupère les données d'un listing depuis Supabase
 * et génère des métadonnées complètes pour le SEO, Open Graph, et Twitter Cards.
 *
 * Features:
 * - SEO optimisé avec titre et description dynamiques
 * - Open Graph pour partage social
 * - Twitter Cards pour Twitter
 * - Images optimisées avec fallback
 * - Gestion des erreurs avec métadonnées par défaut
 *
 * @param params - Paramètres de la route avec ID du listing
 * @returns Promise<Metadata> - Métadonnées complètes pour Next.js
 */
export async function generateListingMetadata({
  params,
}: MetadataParams): Promise<Metadata> {
  const { id } = params;

  // Validation de l'ID
  const numericId = parseInt(id, 10);
  if (isNaN(numericId) || numericId <= 0) {
    return getDefaultErrorMetadata();
  }

  try {
    // Récupération optimisée du listing avec gestion d'erreurs
    const { data: listing, error } = await supabase
      .from("listing")
      .select(
        `
        id,
        name,
        address,
        description,
        product_type,
        certifications,
        purchase_mode,
        listingImages(url)
      `
      )
      .eq("id", numericId)
      .eq("active", true)
      .single();

    if (!listing || error) {
      console.warn(`[SEO] Listing not found for ID: ${numericId}`, error);
      return getDefaultErrorMetadata();
    }

    return buildListingMetadata(listing);
  } catch (error) {
    console.error("[SEO] Error generating metadata:", error);
    return getDefaultErrorMetadata();
  }
}

/**
 * Construit les métadonnées complètes à partir d'un listing
 */
function buildListingMetadata(listing: ListingForMetadata): Metadata {
  // Construction du titre optimisé
  const title = buildTitle(listing.name, listing.address);

  // Construction de la description optimisée
  const description = buildDescription(listing);

  // URL de l'image principale avec fallback
  const imageUrl = getImageUrl(listing.listingImages);

  // Keywords SEO basés sur le contenu
  const keywords = buildKeywords(listing);

  return {
    title,
    description,
    keywords: keywords.join(", "),

    // ✅ Open Graph pour réseaux sociaux
    openGraph: {
      title,
      description,
      type: "website", // ✅ Type valide pour Next.js
      locale: "fr_FR",
      siteName: "Farm To Fork",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `Photo de ${listing.name}`,
              type: "image/jpeg",
            },
          ]
        : [],
    },

    // ✅ Twitter Cards
    twitter: {
      card: "summary_large_image",
      title: title.length > 70 ? `${title.substring(0, 67)}...` : title,
      description:
        description.length > 200
          ? `${description.substring(0, 197)}...`
          : description,
      images: imageUrl ? [imageUrl] : [],
      creator: "@FarmToForkFR",
    },

    // ✅ Métadonnées supplémentaires pour le SEO
    other: {
      "og:business:contact_data:locality": extractCity(listing.address),
      "og:business:contact_data:region": extractRegion(listing.address),
      "og:business:contact_data:country_name": "France",
      "business:contact_data:website": "https://farmtofork.fr",
    },

    // ✅ Robots et canonique
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": 160,
      },
    },
  };
}

/**
 * Construit un titre SEO optimisé
 */
function buildTitle(name: string, address: string): string {
  const cleanName = name?.trim() || "Ferme locale";
  const city = extractCity(address);

  if (city) {
    return `${cleanName} - Ferme à ${city} | Farm To Fork`;
  }

  return `${cleanName} - Producteur local | Farm To Fork`;
}

/**
 * Construit une description SEO optimisée
 */
function buildDescription(listing: ListingForMetadata): string {
  const name = listing.name?.trim() || "Cette ferme";
  const city = extractCity(listing.address);

  // Utiliser la description existante ou en générer une
  if (listing.description && listing.description.length > 20) {
    const cleanDesc = listing.description.trim();
    const truncated =
      cleanDesc.length > 155 ? `${cleanDesc.substring(0, 152)}...` : cleanDesc;
    return truncated;
  }

  // Description générée basée sur les données
  const locationText = city ? ` située à ${city}` : " dans votre région";
  return `Découvrez ${name}, ferme locale${locationText}. Produits frais, locaux et de qualité directement du producteur.`;
}

/**
 * Obtient l'URL de l'image principale avec fallback
 */
function getImageUrl(images: { url: string }[]): string | null {
  if (!images || images.length === 0) return null;

  const imageUrl = images[0]?.url;
  if (!imageUrl || imageUrl.trim() === "") return null;

  // Vérifier que l'URL est valide
  try {
    new URL(imageUrl);
    return imageUrl;
  } catch {
    return null;
  }
}

/**
 * Construit les mots-clés SEO
 */
function buildKeywords(listing: ListingForMetadata): string[] {
  const keywords = [
    listing.name,
    "ferme locale",
    "producteur",
    "agriculture",
    "produits frais",
    "Farm To Fork",
  ];

  // Ajouter la ville si disponible
  const city = extractCity(listing.address);
  if (city) {
    keywords.push(city, `ferme ${city}`, `producteur ${city}`);
  }

  // Ajouter le type de produits si disponible (from listing)
  // Note: Ces champs ne sont pas dans le select actuel, mais pourraient être ajoutés

  return keywords.filter(Boolean);
}

/**
 * Extrait la ville de l'adresse
 */
function extractCity(address: string): string | null {
  if (!address) return null;

  // Supposer que la ville est le premier élément avant la virgule
  const parts = address.split(",");
  const city = parts[0]?.trim();

  return city && city.length > 1 ? city : null;
}

/**
 * Extrait la région de l'adresse
 */
function extractRegion(address: string): string | null {
  if (!address) return null;

  // Supposer que la région est le second élément après la virgule
  const parts = address.split(",");
  const region = parts[1]?.trim();

  return region && region.length > 1 ? region : null;
}

/**
 * Métadonnées par défaut en cas d'erreur
 */
function getDefaultErrorMetadata(): Metadata {
  return {
    title: "Ferme introuvable | Farm To Fork",
    description:
      "Cette ferme n'est pas disponible actuellement. Découvrez d'autres producteurs locaux sur Farm To Fork.",
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title: "Ferme introuvable | Farm To Fork",
      description: "Cette ferme n'est pas disponible actuellement.",
      type: "website",
      locale: "fr_FR",
      siteName: "Farm To Fork",
    },
  };
}

/**
 * Export de types pour utilisation externe
 */
export type { MetadataParams, ListingForMetadata };
