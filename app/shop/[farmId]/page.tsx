"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MapPin, Clock, Truck, Phone, Mail, ShoppingCart, ArrowLeft } from "lucide-react";
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
  description?: string;
  phone?: string;
  email?: string;
  product_type?: string[];
  listingImages?: Array<{ url: string }>;
  image_url?: string;
  delivery_available?: boolean;
  delivery_days?: string;
  pickup_days?: string;
  opening_hours?: string;
  created_at?: string;
}

/**
 * Page Ferme (vitrine) - Étape 2
 *
 * Features:
 * - Présentation de la ferme
 * - CTA "Entrer dans la boutique"
 * - Informations pratiques
 */
export default function FarmShowcasePage(): JSX.Element {
  const params = useParams();
  const router = useRouter();
  const farmId = params.farmId as string;

  const [farm, setFarm] = useState<Farm | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les données de la ferme
  useEffect(() => {
    async function loadFarm() {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("listings")
          .select("*")
          .eq("id", farmId)
          .eq("active", true)
          .single();

        if (error) throw error;

        setFarm(data);
      } catch (error) {
        console.error("Erreur chargement ferme:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (farmId) {
      loadFarm();
    }
  }, [farmId]);

  // Obtenir l'image principale
  const getMainImage = (): string => {
    if (!farm) return "/default-farm-image.jpg";
    if (Array.isArray(farm.listingImages) && farm.listingImages.length > 0) {
      return farm.listingImages[0]?.url || "/default-farm-image.jpg";
    }
    return farm.image_url || "/default-farm-image.jpg";
  };

  // État de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full animate-spin mx-auto mb-4"
            style={{
              borderColor: `${COLORS.PRIMARY} ${COLORS.PRIMARY} ${COLORS.PRIMARY} transparent`
            }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement de la ferme...</p>
        </div>
      </div>
    );
  }

  // Ferme non trouvée
  if (!farm) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.BG_GRAY }}>
        <div className="text-center">
          <div className="text-6xl mb-4">🏪</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
            Ferme non trouvée
          </h2>
          <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            Cette ferme n'existe pas ou n'est plus disponible
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium"
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Retour aux fermes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: COLORS.BG_GRAY }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Bouton retour */}
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 mb-6 text-sm hover:underline"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux fermes
        </Link>

        {/* Image principale */}
        <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden mb-8 shadow-lg">
          <OptimizedImage
            src={getMainImage()}
            alt={farm.name}
            fill
            className="object-cover"
            showSkeleton
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-4xl font-bold mb-2"
            style={{ color: COLORS.TEXT_PRIMARY }}
          >
            {farm.name}
          </h1>
          <p className="text-lg" style={{ color: COLORS.TEXT_SECONDARY }}>
            Producteur local
            {farm.created_at &&
              ` – depuis ${new Date(farm.created_at).getFullYear()}`}
          </p>
        </div>

        {/* Informations pratiques */}
        <div
          className="p-6 rounded-xl mb-8 border"
          style={{
            backgroundColor: COLORS.BG_WHITE,
            borderColor: COLORS.BORDER,
          }}
        >
          <div className="space-y-4">
            {/* Adresse */}
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.PRIMARY }} />
              <div>
                <p className="font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Adresse
                </p>
                <p style={{ color: COLORS.TEXT_SECONDARY }}>{farm.address}</p>
              </div>
            </div>

            {/* Jours de retrait */}
            {farm.pickup_days && (
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.PRIMARY }} />
                <div>
                  <p className="font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Jours de retrait
                  </p>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>{farm.pickup_days}</p>
                </div>
              </div>
            )}

            {/* Livraison */}
            {farm.delivery_available && (
              <div className="flex items-start gap-3">
                <Truck className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: COLORS.PRIMARY }} />
                <div>
                  <p className="font-medium" style={{ color: COLORS.TEXT_PRIMARY }}>
                    Livraison locale
                  </p>
                  <p style={{ color: COLORS.TEXT_SECONDARY }}>
                    {farm.delivery_days || "Disponible"}
                  </p>
                </div>
              </div>
            )}

            {/* Contact */}
            {(farm.phone || farm.email) && (
              <div className="pt-4 border-t" style={{ borderColor: COLORS.BORDER }}>
                <p className="font-medium mb-2" style={{ color: COLORS.TEXT_PRIMARY }}>
                  Contact
                </p>
                {farm.phone && (
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="w-4 h-4" style={{ color: COLORS.TEXT_SECONDARY }} />
                    <a
                      href={`tel:${farm.phone}`}
                      className="hover:underline"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {farm.phone}
                    </a>
                  </div>
                )}
                {farm.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" style={{ color: COLORS.TEXT_SECONDARY }} />
                    <a
                      href={`mailto:${farm.email}`}
                      className="hover:underline"
                      style={{ color: COLORS.TEXT_SECONDARY }}
                    >
                      {farm.email}
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {farm.description && (
          <div
            className="p-6 rounded-xl mb-8 border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <h2 className="text-xl font-bold mb-3" style={{ color: COLORS.TEXT_PRIMARY }}>
              À propos
            </h2>
            <p className="leading-relaxed" style={{ color: COLORS.TEXT_SECONDARY }}>
              {farm.description}
            </p>
          </div>
        )}

        {/* Section CTA (très importante) */}
        <div
          className="p-8 rounded-2xl text-center border-2"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}40`,
          }}
        >
          <div className="mb-6">
            <ShoppingCart
              className="w-16 h-16 mx-auto mb-4"
              style={{ color: COLORS.PRIMARY }}
            />
            <h2 className="text-2xl font-bold mb-2" style={{ color: COLORS.PRIMARY }}>
              Faire mes courses chez cette ferme
            </h2>
          </div>

          <Link
            href={`/shop/${farmId}/boutique`}
            className={cn(
              "inline-flex items-center justify-center gap-3 px-8 py-4 rounded-lg",
              "text-lg font-semibold transition-all duration-200 hover:shadow-xl hover:scale-105"
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
            <ShoppingCart className="w-6 h-6" />
            Entrer dans la boutique
          </Link>

          {/* Sous-texte rassurant */}
          <p className="mt-4 text-sm" style={{ color: COLORS.TEXT_SECONDARY }}>
            Vous achetez uniquement chez cette ferme
          </p>
        </div>
      </div>
    </div>
  );
}
