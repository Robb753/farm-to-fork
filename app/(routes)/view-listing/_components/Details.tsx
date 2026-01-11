// app/(routes)/view-listing/_components/Details.tsx
"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Share,
  Leaf,
  Award,
  Clock,
  ShoppingBag,
  CalendarCheck,
  Truck,
  Home,
  Copy,
  ExternalLink,
  Heart,
  Eye,
} from "@/utils/icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

// Import des composants
import AgentDetail from "./AgentDetail";
import SingleFarmMapbox from "@/app/modules/maps/components/SingleFarmMapbox";

/**
 * Type pour un listing avec toutes ses données
 */
type ListingDetail = Database["public"]["Tables"]["listing"]["Row"] & {
  listingImages?: Database["public"]["Tables"]["listingImages"]["Row"][];
};

/**
 * Props du composant Details
 */
interface DetailsProps {
  listingDetail: ListingDetail | null;
  className?: string;
}

/**
 * Interface pour une caractéristique clé
 */
interface KeyFeature {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
  isHighlight?: boolean;
}

/**
 * Interface pour les coordonnées
 */
interface Coordinates {
  lat?: number;
  lng?: number;
}

/**
 * Composant de détails complets d'un listing de ferme
 *
 * Features:
 * - Affichage structuré de toutes les informations
 * - Système de partage multi-plateforme
 * - Caractéristiques clés avec icônes colorées
 * - Carte interactive avec Mapbox
 * - Analytics et tracking intégrés
 * - Design responsive et moderne
 *
 * @param listingDetail - Données complètes du listing
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Interface détaillée complète
 */
export default function Details({
  listingDetail,
  className,
}: DetailsProps): JSX.Element | null {
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [shareCount, setShareCount] = useState<number>(0);

  // Early return si pas de données
  if (!listingDetail) {
    return null;
  }

  /**
   * Formate intelligemment les listes d'attributs
   */
  const formatList = useCallback(
    (list: string[] | string | null | undefined): string => {
      if (!list) return "Non spécifié";

      if (typeof list === "string") {
        try {
          // Essayer de parser si c'est un JSON string
          const parsed = JSON.parse(list);
          if (Array.isArray(parsed)) {
            return parsed.length > 0 ? parsed.join(", ") : "Non spécifié";
          }
          return list;
        } catch {
          return list || "Non spécifié";
        }
      }

      if (Array.isArray(list)) {
        return list.length > 0 ? list.join(", ") : "Non spécifié";
      }

      return "Non spécifié";
    },
    []
  );

  /**
   * Caractéristiques clés avec configuration avancée
   */
  const keyFeatures: KeyFeature[] = useMemo(() => {
    // ✅ On prépare proprement la valeur de certifications
    const certificationsValue = formatList(listingDetail.certifications);

    const hasCertifications =
      !!listingDetail.certifications &&
      certificationsValue !== "Non spécifié" &&
      certificationsValue !== "Aucune certification";

    return [
      {
        icon: <Leaf className="h-5 w-5" />,
        label: "Type de produits",
        value: formatList(listingDetail.product_type),
        color: "green",
        isHighlight: true,
      },
      {
        icon: <Home className="h-5 w-5" />,
        label: "Méthode de production",
        value: formatList(listingDetail.production_method),
        color: "blue",
      },
      {
        icon: <Award className="h-5 w-5" />,
        label: "Certifications",
        value: certificationsValue || "Aucune certification",
        color: "purple",
        // ✅ Ici c’est **toujours** un boolean
        isHighlight: hasCertifications,
      },
      {
        icon: <Clock className="h-5 w-5" />,
        label: "Disponibilité",
        value: formatList(listingDetail.availability),
        color: "orange",
      },
      {
        icon: <ShoppingBag className="h-5 w-5" />,
        label: "Modes d'achat",
        value: formatList(listingDetail.purchase_mode),
        color: "indigo",
      },
      {
        icon: <CalendarCheck className="h-5 w-5" />,
        label: "Services additionnels",
        value:
          formatList(listingDetail.additional_services) ||
          "Aucun service additionnel",
        color: "teal",
      },
    ];
  }, [listingDetail, formatList]);


  /**
   * Extrait les coordonnées de manière robuste
   */
  const getCoordinates = useCallback((): Coordinates | null => {
    // Priorité 1: lat/lng directs
    if (listingDetail.lat && listingDetail.lng) {
      return { lat: listingDetail.lat, lng: listingDetail.lng };
    }

    // Priorité 2: objet coordinates
    if (listingDetail.coordinates) {
      if (typeof listingDetail.coordinates === "object") {
        const coords = listingDetail.coordinates as any;
        if (coords.lat && coords.lng) {
          return { lat: coords.lat, lng: coords.lng };
        }
        if (Array.isArray(coords) && coords.length >= 2) {
          return { lat: coords[0], lng: coords[1] };
        }
      }
    }

    return null;
  }, [listingDetail]);

  /**
   * Gère le partage multi-plateforme
   */
  const handleShare = useCallback(async (): Promise<void> => {
    setIsSharing(true);

    try {
      const shareData = {
        title: `${listingDetail.name || "Ferme locale"} | Farm To Fork`,
        text: `Découvrez ${listingDetail.name || "cette ferme locale"} - Produits frais et locaux`,
        url: window.location.href,
      };

      // Utiliser l'API Web Share si disponible (mobile principalement)
      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);

        setShareCount((prev) => prev + 1);
        toast.success("Contenu partagé avec succès !");

        // Analytics tracking
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "share", {
            event_category: "listing_interaction",
            event_label: "web_share_api",
            listing_id: listingDetail.id,
            listing_name: listingDetail.name,
          });
        }
      } else {
        // Fallback: copier dans le presse-papier
        await navigator.clipboard.writeText(window.location.href);
        setShareCount((prev) => prev + 1);
        toast.success("Lien copié dans le presse-papier !");

        // Analytics tracking
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "share", {
            event_category: "listing_interaction",
            event_label: "clipboard_copy",
            listing_id: listingDetail.id,
            listing_name: listingDetail.name,
          });
        }
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error);

      // Fallback ultime
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié dans le presse-papier !");
      } catch {
        toast.error("Impossible de partager ou copier le lien");
      }
    } finally {
      setIsSharing(false);
    }
  }, [listingDetail.id, listingDetail.name]);

  /**
   * Couleurs pour les icônes des caractéristiques
   */
  const getFeatureColorClasses = useCallback(
    (color: string, isHighlight: boolean = false) => {
      const baseClasses = {
        green: isHighlight
          ? "bg-green-200 text-green-700"
          : "bg-green-100 text-green-600",
        blue: "bg-blue-100 text-blue-600",
        purple: isHighlight
          ? "bg-purple-200 text-purple-700"
          : "bg-purple-100 text-purple-600",
        orange: "bg-orange-100 text-orange-600",
        indigo: "bg-indigo-100 text-indigo-600",
        teal: "bg-teal-100 text-teal-600",
      };

      return (
        baseClasses[color as keyof typeof baseClasses] ||
        "bg-gray-100 text-gray-600"
      );
    },
    []
  );

  const coordinates = getCoordinates();

  return (
    <div className={cn("space-y-8", className)}>
      {/* En-tête avec nom, adresse et actions */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          {/* Informations principales */}
          <div className="space-y-3 flex-1">
            <div className="flex items-start gap-3">
              <h1 className="font-bold text-3xl lg:text-4xl text-gray-900 leading-tight">
                {listingDetail.name || "Ferme locale"}
              </h1>

              {/* Badge de statut */}
              {listingDetail.active && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex-shrink-0 mt-2">
                  ✅ Actif
                </span>
              )}
            </div>

            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-1" />
              <p className="text-lg leading-relaxed">
                {listingDetail.address || "Adresse non spécifiée"}
              </p>
            </div>

            {/* Métadonnées rapides */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              {listingDetail.created_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Créé le{" "}
                  {new Date(listingDetail.created_at).toLocaleDateString(
                    "fr-FR"
                  )}
                </div>
              )}

              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {Math.floor(Math.random() * 1000) + 100} vues
              </div>

              {shareCount > 0 && (
                <div className="flex items-center gap-1">
                  <Share className="h-4 w-4" />
                  {shareCount} partage{shareCount > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 flex-shrink-0">
            <Button
              variant="outline"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-200 hover:bg-red-50"
            >
              <Heart className="h-4 w-4" />
              Sauvegarder
            </Button>

            <Button
              onClick={handleShare}
              disabled={isSharing}
              variant="outline"
              className="flex items-center gap-2 text-gray-600 hover:text-green-600 hover:border-green-600 hover:bg-green-50"
            >
              {isSharing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div>
                  Partage...
                </>
              ) : (
                <>
                  <Share className="h-4 w-4" />
                  Partager
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Caractéristiques clés améliorées */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="font-bold text-2xl text-gray-900 mb-6">
          Caractéristiques clés
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyFeatures.map((feature, index) => (
            <div
              key={index}
              className={cn(
                "group relative bg-gray-50 rounded-xl p-5 border border-gray-200",
                "hover:border-green-200 hover:shadow-md hover:bg-green-50/30",
                "transition-all duration-300 cursor-pointer",
                feature.isHighlight && "ring-2 ring-green-200 bg-green-50/50"
              )}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={cn(
                    "p-3 rounded-full transition-colors",
                    getFeatureColorClasses(
                      feature.color || "gray",
                      feature.isHighlight
                    )
                  )}
                >
                  {feature.icon}
                </div>
                <h3 className="font-semibold text-gray-800 group-hover:text-green-700">
                  {feature.label}
                </h3>
              </div>

              <p className="text-gray-600 leading-relaxed pl-14">
                {feature.value}
              </p>

              {feature.isHighlight && (
                <div className="absolute top-3 right-3">
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                    ⭐
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Description enrichie */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="font-bold text-2xl text-gray-900 mb-6">
          À propos de cette ferme
        </h2>

        {listingDetail.description ? (
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {listingDetail.description}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Home className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 italic">
              Aucune description disponible pour cette ferme.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Le producteur n'a pas encore ajouté de description détaillée.
            </p>
          </div>
        )}
      </div>

      {/* Carte interactive */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-2xl text-gray-900">Localisation</h2>

          {coordinates && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ouvrir dans Maps
            </Button>
          )}
        </div>

        <div className="rounded-xl overflow-hidden border border-gray-200 h-[450px]">
          {coordinates ? (
            <SingleFarmMapbox
              lat={coordinates.lat!}
              lng={coordinates.lng!}
              name={listingDetail.name ?? undefined}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full bg-gray-100">
              <div className="bg-gray-200 rounded-full w-20 h-20 flex items-center justify-center mb-4">
                <MapPin className="h-10 w-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg mb-2">
                Localisation non disponible
              </p>
              <p className="text-sm text-gray-400 text-center max-w-md">
                Les coordonnées GPS de cette ferme ne sont pas encore
                disponibles. Contactez le producteur pour plus d'informations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact du producteur */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="font-bold text-2xl text-gray-900 mb-6">
          Contact du producteur
        </h2>
        <AgentDetail listingDetail={listingDetail} />
      </div>
    </div>
  );
}
