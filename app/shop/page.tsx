"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { MapPin, ShoppingBag, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";
import { supabase } from "@/utils/supabase/client";
import OptimizedImage from "@/components/ui/OptimizedImage";

/**
 * Interface pour une ferme
 */
interface Farm {
  id: number;
  name: string;
  address: string;
  lat?: number;
  lng?: number;
  product_type?: string[];
  image_url?: string;
  listingImages?: Array<{ url: string }>;
  delivery_available?: boolean;
  distance?: number;
}

/**
 * Page principale - Liste des fermes "supermarché-like"
 *
 * Étape 1 du flow UX : Carte / Liste des fermes
 */
export default function ShopPage(): JSX.Element {
  const [farms, setFarms] = useState<Farm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les fermes depuis Supabase
  useEffect(() => {
    async function loadFarms() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("active", true)
          .order("created_at", { ascending: false });

        if (error) throw error;

        setFarms(data || []);
      } catch (error) {
        console.error("Erreur chargement fermes:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadFarms();
  }, []);

  // Fonction pour obtenir les emojis de produits
  const getProductEmojis = (productTypes: string[] = []): string => {
    const emojiMap: Record<string, string> = {
      "Légumes": "🥔",
      "Fruits": "🍎",
      "Œufs": "🥚",
      "Produits laitiers": "🧀",
      "Viande": "🥩",
      "Produits transformés": "🍯",
    };

    return productTypes
      .slice(0, 3)
      .map((type) => emojiMap[type] || "🌾")
      .join(" ");
  };

  // Obtenir l'image de la ferme
  const getFarmImage = (farm: Farm): string => {
    if (Array.isArray(farm.listingImages) && farm.listingImages.length > 0) {
      return farm.listingImages[0]?.url || "/default-farm-image.jpg";
    }
    return farm.image_url || "/default-farm-image.jpg";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`
            }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement des fermes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Titre */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            Des producteurs près de chez vous
          </h1>
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Achetez local comme au supermarché
          </p>
        </div>

        {/* Grille de fermes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farms.map((farm) => (
            <FarmCard
              key={farm.id}
              farm={farm}
              productEmojis={getProductEmojis(farm.product_type)}
              imageUrl={getFarmImage(farm)}
            />
          ))}
        </div>

        {/* État vide */}
        {farms.length === 0 && !isLoading && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏪</div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
              Aucune ferme disponible
            </h2>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              Revenez bientôt pour découvrir nos producteurs locaux
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Carte ferme (card) - Design supermarché-like
 */
function FarmCard({
  farm,
  productEmojis,
  imageUrl
}: {
  farm: Farm;
  productEmojis: string;
  imageUrl: string;
}): JSX.Element {
  const [imageError, setImageError] = useState(false);

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border shadow-sm",
        "transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
      )}
      style={{
        backgroundColor: COLORS.BG_WHITE,
        borderColor: COLORS.BORDER,
      }}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        {!imageError ? (
          <OptimizedImage
            src={imageUrl}
            alt={farm.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImageError(true)}
            showSkeleton
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: COLORS.BG_GRAY }}
          >
            <ShoppingBag className="w-12 h-12" style={{ color: COLORS.TEXT_MUTED }} />
          </div>
        )}

        {/* Badge livraison */}
        {farm.delivery_available && (
          <div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-md"
            style={{
              backgroundColor: COLORS.SUCCESS,
              color: COLORS.BG_WHITE,
            }}
          >
            <Truck className="w-3 h-3" />
            Livraison locale disponible
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h2
          className="text-xl font-bold mb-2"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {farm.name}
        </h2>

        {/* Produits */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-lg">{productEmojis}</span>
          <span style={{ color: COLORS.TEXT_SECONDARY }}>
            {farm.product_type?.slice(0, 3).join(" • ")}
          </span>
        </div>

        {/* Localisation */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <MapPin className="w-4 h-4" style={{ color: COLORS.PRIMARY }} />
          <span style={{ color: COLORS.TEXT_SECONDARY }}>
            {farm.distance ? `${farm.distance} km` : farm.address}
          </span>
        </div>

        {/* Bouton CTA */}
        <Link
          href={`/shop/${farm.id}`}
          className={cn(
            "block w-full py-3 px-4 rounded-lg text-center font-medium",
            "transition-all duration-200 hover:shadow-md"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY,
            color: COLORS.BG_WHITE,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY_DARK;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
          }}
        >
          Voir la ferme
        </Link>
      </div>
    </article>
  );
}
