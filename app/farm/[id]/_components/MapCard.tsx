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

interface MapCardProps {
  listing: ListingWithLocation | null;
  className?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
  isValid: boolean;
}

const DEFAULT_COORDS: Coordinates = { lat: 0, lng: 0, isValid: false };

export default function MapCard({
  listing,
  className,
}: MapCardProps): JSX.Element | null {
  const [isLoadingDirections, setIsLoadingDirections] =
    useState<boolean>(false);

  // ✅ Hooks toujours appelés, même si listing est null
  const coordinates: Coordinates = useMemo(() => {
    if (!listing) return DEFAULT_COORDS;

    let lat: number | null = null;
    let lng: number | null = null;

    // Méthode 1: Propriétés directes lat/lng
    if (typeof listing.lat === "number" && typeof listing.lng === "number") {
      lat = listing.lat;
      lng = listing.lng;
    }
    // Méthode 2: Objet coordinates
    else if ((listing as any).coordinates) {
      const raw = (listing as any).coordinates;

      if (typeof raw === "object" && raw !== null) {
        const coords = raw as any;

        if (typeof coords.lat === "number" && typeof coords.lng === "number") {
          lat = coords.lat;
          lng = coords.lng;
        } else if (
          typeof coords.latitude === "number" &&
          typeof coords.longitude === "number"
        ) {
          lat = coords.latitude;
          lng = coords.longitude;
        } else if (Array.isArray(coords) && coords.length >= 2) {
          lat = typeof coords[0] === "number" ? coords[0] : null;
          lng = typeof coords[1] === "number" ? coords[1] : null;
        }
      } else if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length >= 2) {
            lat = typeof parsed[0] === "number" ? parsed[0] : null;
            lng = typeof parsed[1] === "number" ? parsed[1] : null;
          }
        } catch {
          // ignore
        }
      }
    }

    const isValidLat = lat !== null && lat >= -90 && lat <= 90;
    const isValidLng = lng !== null && lng >= -180 && lng <= 180;
    const isValid = isValidLat && isValidLng;

    return { lat: lat ?? 0, lng: lng ?? 0, isValid };
  }, [listing]);

  const getGoogleMapsUrl = useCallback((lat: number, lng: number): string => {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }, []);

  const getAppleMapsUrl = useCallback((lat: number, lng: number): string => {
    return `http://maps.apple.com/?daddr=${lat},${lng}`;
  }, []);

  const handleGetDirections = useCallback(async (): Promise<void> => {
    if (!coordinates.isValid) {
      toast.error("Coordonnées non disponibles");
      return;
    }

    setIsLoadingDirections(true);

    try {
      const userAgent = navigator.userAgent.toLowerCase();
      const isIOS = /iphone|ipad|ipod/.test(userAgent);
      const isMac = /mac/.test(userAgent);

      const url =
        isIOS || isMac
          ? getAppleMapsUrl(coordinates.lat, coordinates.lng)
          : getGoogleMapsUrl(coordinates.lat, coordinates.lng);

      window.open(url, "_blank", "noopener,noreferrer");

      if (typeof window !== "undefined" && (window as any).gtag && listing) {
        (window as any).gtag("event", "get_directions", {
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
    coordinates.isValid,
    coordinates.lat,
    coordinates.lng,
    getAppleMapsUrl,
    getGoogleMapsUrl,
    listing,
  ]);

  const handleCopyCoordinates = useCallback(async (): Promise<void> => {
    if (!coordinates.isValid) {
      toast.error("Coordonnées non disponibles");
      return;
    }

    try {
      const coordsText = `${coordinates.lat}, ${coordinates.lng}`;
      await navigator.clipboard.writeText(coordsText);

      toast.success("Coordonnées copiées dans le presse-papier");

      if (typeof window !== "undefined" && (window as any).gtag && listing) {
        (window as any).gtag("event", "copy_coordinates", {
          event_category: "map_interaction",
          listing_id: listing.id,
        });
      }
    } catch {
      toast.error("Impossible de copier les coordonnées");
    }
  }, [coordinates.isValid, coordinates.lat, coordinates.lng, listing]);

  const handleShareLocation = useCallback(async (): Promise<void> => {
    if (!coordinates.isValid) {
      toast.error("Localisation non disponible");
      return;
    }

    try {
      const name = listing?.name || "cette ferme";
      const address = listing?.address || "coordonnées GPS";
      const url = getGoogleMapsUrl(coordinates.lat, coordinates.lng);

      const shareData = {
        title: `Localisation de ${name}`,
        text: `Retrouvez ${name} à cette adresse : ${address}`,
        url,
      };

      const canNativeShare =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        "canShare" in navigator &&
        (navigator as any).canShare?.(shareData);

      if (canNativeShare) {
        await (navigator as any).share(shareData);
        toast.success("Localisation partagée avec succès");
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Lien de localisation copié");
      }

      if (typeof window !== "undefined" && (window as any).gtag && listing) {
        (window as any).gtag("event", "share_location", {
          event_category: "map_interaction",
          listing_id: listing.id,
        });
      }
    } catch (error) {
      console.error("Erreur lors du partage de localisation:", error);
      toast.error("Impossible de partager la localisation");
    }
  }, [
    coordinates.isValid,
    coordinates.lat,
    coordinates.lng,
    getGoogleMapsUrl,
    listing,
  ]);

  // ✅ Maintenant seulement, les early returns
  if (!listing) return null;
  if (!coordinates.isValid) return null;

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

          <div className="text-xs text-gray-500 font-mono">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </div>
        </div>

        {listing.address && (
          <p className="text-sm text-gray-600 mt-1">{listing.address}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        <div className="relative group">
          <div className="aspect-[4/3] rounded-lg overflow-hidden border border-gray-200 bg-gray-100">
            <SingleFarmMapbox
              lat={coordinates.lat}
              lng={coordinates.lng}
              name={name}
            />
          </div>

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

        <div className="flex flex-col gap-2">
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
