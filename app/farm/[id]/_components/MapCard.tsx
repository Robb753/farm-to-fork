"use client";

import SingleFarmMapbox from "@/app/modules/maps/components/SingleFarmMapbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, ExternalLink, Copy } from "@/utils/icons";
import { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec coordonnées
 */
type ListingWithLocation = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant MapCard
 */
interface MapCardProps {
  listing: ListingWithLocation | null;
  className?: string;
}

/**
 * Interface pour les coordonnées normalisées
 */
interface Coordinates {
  lat: number;
  lng: number;
  isValid: boolean;
}

/**
 * Composant de carte de localisation pour un listing
 *
 * Features:
 * - Affichage de carte interactive avec Mapbox
 * - Actions rapides (directions, partage de localisation)
 * - Gestion robuste des coordonnées multiples formats
 * - Fallback élégant si pas de coordonnées
 * - Intégration avec services externes (Google Maps, Apple Plans)
 * - Analytics et tracking des interactions
 *
 * @param listing - Données du listing avec localisation
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Card de carte interactive
 */
export default function MapCard({
  listing,
  className,
}: MapCardProps): JSX.Element | null {
  const [isLoadingDirections, setIsLoadingDirections] =
    useState<boolean>(false);

  // Early return si pas de listing
  if (!listing) {
    return null;
  }

  /**
   * Extrait et valide les coordonnées de manière robuste
   */
  const coordinates: Coordinates = useMemo(() => {
    let lat: number | null = null;
    let lng: number | null = null;

    // Méthode 1: Propriétés directes lat/lng
    if (typeof listing.lat === "number" && typeof listing.lng === "number") {
      lat = listing.lat;
      lng = listing.lng;
    }
    // Méthode 2: Objet coordinates
    else if (listing.coordinates) {
      if (typeof listing.coordinates === "object") {
        const coords = listing.coordinates as any;

        // Format objet {lat, lng}
        if (typeof coords.lat === "number" && typeof coords.lng === "number") {
          lat = coords.lat;
          lng = coords.lng;
        }
        // Format objet {latitude, longitude}
        else if (
          typeof coords.latitude === "number" &&
          typeof coords.longitude === "number"
        ) {
          lat = coords.latitude;
          lng = coords.longitude;
        }
        // Format tableau [lat, lng]
        else if (Array.isArray(coords) && coords.length >= 2) {
          lat = typeof coords[0] === "number" ? coords[0] : null;
          lng = typeof coords[1] === "number" ? coords[1] : null;
        }
      }
      // Si c'est une string, essayer de parser
      else if (typeof listing.coordinates === "string") {
        try {
          const parsed = JSON.parse(listing.coordinates);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            lat = typeof parsed[0] === "number" ? parsed[0] : null;
            lng = typeof parsed[1] === "number" ? parsed[1] : null;
          }
        } catch {
          // Parsing failed, keep null values
        }
      }
    }

    // Validation des coordonnées
    const isValidLat = lat !== null && lat >= -90 && lat <= 90;
    const isValidLng = lng !== null && lng >= -180 && lng <= 180;
    const isValid = isValidLat && isValidLng;

    return {
      lat: lat || 0,
      lng: lng || 0,
      isValid,
    };
  }, [listing.lat, listing.lng, listing.coordinates]);

  /**
   * Génère l'URL Google Maps pour les directions
   */
  const getGoogleMapsUrl = useCallback((coords: Coordinates): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`;
  }, []);

  /**
   * Génère l'URL Apple Plans pour les directions (iOS/macOS)
   */
  const getAppleMapsUrl = useCallback((coords: Coordinates): string => {
    return `http://maps.apple.com/?daddr=${coords.lat},${coords.lng}`;
  }, []);

  /**
   * Ouvre les directions selon la plateforme
   */
  const handleGetDirections = useCallback(async (): Promise<void> => {
    if (!coordinates.isValid) {
      toast.error("Coordonnées non disponibles");
      return;
    }

    setIsLoadingDirections(true);

    try {
      // Détecter la plateforme
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isMac = /mac/.test(userAgent);

      let url: string;

      // Utiliser Apple Plans sur iOS/macOS, Google Maps sinon
      if (isIOS || isMac) {
        url = getAppleMapsUrl(coordinates);
      } else {
        url = getGoogleMapsUrl(coordinates);
      }

      // Ouvrir dans un nouvel onglet
      window.open(url, "_blank", "noopener,noreferrer");

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "get_directions", {
          event_category: "map_interaction",
          listing_id: listing.id,
          listing_name: listing.name,
          platform: isIOS || isMac ? "apple_maps" : "google_maps",
        });
      }

      toast.success("Directions ouvertes dans l'application de cartes");
    } catch (error) {
      console.error("Erreur lors de l'ouverture des directions:", error);
      toast.error("Impossible d'ouvrir les directions");
    } finally {
      setIsLoadingDirections(false);
    }
  }, [
    coordinates,
    listing.id,
    listing.name,
    getAppleMapsUrl,
    getGoogleMapsUrl,
  ]);

  /**
   * Copie les coordonnées dans le presse-papier
   */
  const handleCopyCoordinates = useCallback(async (): Promise<void> => {
    if (!coordinates.isValid) {
      toast.error("Coordonnées non disponibles");
      return;
    }

    try {
      const coordsText = `${coordinates.lat}, ${coordinates.lng}`;
      await navigator.clipboard.writeText(coordsText);

      toast.success("Coordonnées copiées dans le presse-papier");

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "copy_coordinates", {
          event_category: "map_interaction",
          listing_id: listing.id,
        });
      }
    } catch (error) {
      toast.error("Impossible de copier les coordonnées");
    }
  }, [coordinates, listing.id]);

  /**
   * Partage la localisation
   */
  const handleShareLocation = useCallback(async (): Promise<void> => {
    if (!coordinates.isValid) {
      toast.error("Localisation non disponible");
      return;
    }

    try {
      const shareData = {
        title: `Localisation de ${listing.name || "cette ferme"}`,
        text: `Retrouvez ${listing.name || "cette ferme"} à cette adresse : ${listing.address || "coordonnées GPS"}`,
        url: getGoogleMapsUrl(coordinates),
      };

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
        toast.success("Localisation partagée avec succès");
      } else {
        // Fallback: copier le lien Google Maps
        await navigator.clipboard.writeText(getGoogleMapsUrl(coordinates));
        toast.success("Lien de localisation copié");
      }

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "share_location", {
          event_category: "map_interaction",
          listing_id: listing.id,
        });
      }
    } catch (error) {
      console.error("Erreur lors du partage de localisation:", error);
      toast.error("Impossible de partager la localisation");
    }
  }, [
    coordinates,
    listing.id,
    listing.name,
    listing.address,
    getGoogleMapsUrl,
  ]);

  // Ne pas afficher si pas de coordonnées valides
  if (!coordinates.isValid) {
    return null;
  }

  const name = listing.name || "Ferme locale";

  return (
    <Card
      className={cn(
        "overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-green-700 text-lg">
            <MapPin className="h-5 w-5 mr-2" />
            Localisation
          </CardTitle>

          {/* Coordonnées en petit */}
          <div className="text-xs text-gray-500 font-mono">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </div>
        </div>

        {/* Adresse si disponible */}
        {listing.address && (
          <p className="text-sm text-gray-600 mt-1">{listing.address}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Carte interactive */}
        <div className="relative group">
          <div className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
            <SingleFarmMapbox
              lat={coordinates.lat}
              lng={coordinates.lng}
              name={name}
            />
          </div>

          {/* Overlay avec actions au hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg pointer-events-none">
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopyCoordinates}
                className="bg-white/90 hover:bg-white text-gray-700 shadow-md"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex flex-col gap-2">
          {/* Bouton directions */}
          <Button
            onClick={handleGetDirections}
            disabled={isLoadingDirections}
            className="w-full bg-green-600 hover:bg-green-700 text-white transition-all duration-200 hover:shadow-md"
          >
            {isLoadingDirections ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                Ouverture...
              </>
            ) : (
              <>
                <Navigation className="h-4 w-4 mr-2" />
                Obtenir l'itinéraire
              </>
            )}
          </Button>

          {/* Actions secondaires */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLocation}
              className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Partager
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`;
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Ouvrir
            </Button>
          </div>
        </div>

        {/* Info utile */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-blue-800 text-xs text-center">
            💡 <strong>Astuce :</strong> Cliquez sur "Obtenir l'itinéraire" pour
            ouvrir votre app de navigation préférée
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
