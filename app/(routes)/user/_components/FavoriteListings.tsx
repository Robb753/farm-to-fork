// app/_components/FavoriteListings.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, MapPin, Globe, ExternalLink } from "@/utils/icons";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

// ✅ Import userStore avec types
import { useUserFavorites, useUserActions } from "@/lib/store/userStore";

// 🔒 SÉCURITÉ: Import des fonctions de sanitisation
import { escapeHTML, sanitizeHTML } from "@/lib/utils/sanitize";
import { useSupabaseWithClerk } from "@/utils/supabase/client";

/**
 * Type pour un listing favori avec ses images
 */
type FavoriteListing = Database["public"]["Tables"]["listing"]["Row"] & {
  listingImages: Pick<
    Database["public"]["Tables"]["listingImages"]["Row"],
    "url"
  >[];
};

/**
 * États de chargement possibles
 */
type LoadingState = "idle" | "loading" | "success" | "error";

/**
 * Type pour les erreurs
 */
interface ErrorState {
  message: string;
  code?: string;
}

/**
 * Composant d'affichage des listings favoris
 *
 * 🔒 SÉCURITÉ: Toutes les données utilisateur sont protégées contre XSS
 *
 * Features:
 * - Synchronisation avec le userStore pour les favoris
 * - Chargement optimisé des données Supabase
 * - Interface moderne avec animations
 * - Gestion d'erreurs robuste avec retry
 * - Actions rapides (voir, retirer des favoris)
 * - Responsive design adaptatif
 * - Optimisation des performances avec useCallback
 *
 * @returns JSX.Element - Interface des favoris utilisateur
 */
export default function FavoriteListings(): JSX.Element {
  const { user, isLoaded } = useUser();

  // ✅ Utiliser le store pour les IDs des favoris avec types
  const favoriteIds = useUserFavorites();
  const { loadFavorites, toggleFavorite } = useUserActions();

  const supabase = useSupabaseWithClerk();

  // États locaux avec types stricts
  const [favoriteListings, setFavoriteListings] = useState<FavoriteListing[]>(
    []
  );
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<ErrorState | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  /**
   * Charge les favoris depuis le store quand l'utilisateur est prêt
   */
  useEffect(() => {
    if (isLoaded && user?.id) {
      loadFavorites(user.id);
    }
  }, [user?.id, isLoaded, loadFavorites]);

  /**
   * Fonction optimisée pour récupérer les listings complets
   */
  const fetchFavoriteListings = useCallback(async () => {
    if (!favoriteIds.length) {
      setFavoriteListings([]);
      setLoadingState("success");
      return;
    }

    setLoadingState("loading");
    setError(null);

    try {
      const { data, error: supabaseError } = await supabase
        .from("listing")
        .select(
          `
          *,
          listingImages(url)
        `
        )
        .in("id", favoriteIds)
        .eq("active", true); // ✅ Seulement les listings actifs

      if (supabaseError) {
        throw new Error(`Erreur Supabase: ${supabaseError.message}`);
      }

      // ✅ Trier les listings selon l'ordre des favoris
      const sortedListings = favoriteIds
        .map((id) => data?.find((listing) => listing.id === id))
        .filter((listing): listing is FavoriteListing => listing !== undefined);

      setFavoriteListings(sortedListings);
      setLoadingState("success");
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des favoris";
      console.error("[FavoriteListings] Erreur:", err);
      setError({ message: errorMessage });
      setLoadingState("error");
    }
  }, [favoriteIds, supabase]);

  /**
   * Effect pour charger les listings quand les IDs changent
   */
  useEffect(() => {
    fetchFavoriteListings();
  }, [fetchFavoriteListings]);

  /**
   * Gère le retry avec backoff exponentiel
   */
  const handleRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10s

    setTimeout(() => {
      fetchFavoriteListings();
    }, delay);
  }, [fetchFavoriteListings, retryCount]);

  /**
   * Retire un listing des favoris avec optimistic update
   */
  const handleRemoveFavorite = useCallback(
    async (listingId: number) => {
      if (!user?.id) return;

      // Optimistic update
      setFavoriteListings((prev) =>
        prev.filter((listing) => listing.id !== listingId)
      );

      try {
        await toggleFavorite(listingId, user.id);
      } catch (error) {
        console.error("Erreur suppression favori:", error);
        // Revert on error
        fetchFavoriteListings();
      }
    },
    [user?.id, toggleFavorite, fetchFavoriteListings]
  );

  /**
   * Obtient l'URL de l'image principale ou le placeholder
   */
  const getListingImageUrl = useCallback((listing: FavoriteListing): string => {
    return listing.listingImages?.[0]?.url || "/placeholder.png";
  }, []);

  // ✅ État de chargement initial
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // ✅ Utilisateur non connecté
  if (!user) {
    return (
      <div className="text-center p-8">
        <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Connectez-vous pour voir vos favoris</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête avec statistiques */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-bold text-2xl">Mes favoris</h2>
          <p className="text-gray-500 text-sm mt-1">
            {favoriteIds.length}{" "}
            {favoriteIds.length === 1
              ? "ferme sauvegardée"
              : "fermes sauvegardées"}
          </p>
        </div>

        {favoriteIds.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFavoriteListings}
            disabled={loadingState === "loading"}
          >
            Actualiser
          </Button>
        )}
      </div>

      {/* État de chargement */}
      {loadingState === "loading" && (
        <div className="flex items-center justify-center p-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500">Chargement de vos favoris...</p>
          </div>
        </div>
      )}

      {/* État d'erreur */}
      {loadingState === "error" && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 mb-4">
            <p className="font-medium">Erreur lors du chargement</p>
            {/* 🔒 SÉCURITÉ: Message d'erreur échappé */}
            <p className="text-sm mt-1">{escapeHTML(error.message)}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="text-red-600 border-red-200 hover:bg-red-50"
          >
            Réessayer {retryCount > 0 && `(${retryCount})`}
          </Button>
        </div>
      )}

      {/* Aucun favori */}
      {loadingState === "success" && favoriteIds.length === 0 && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900 mb-2">
            Aucun favori pour le moment
          </h3>
          <p className="text-gray-500 mb-6">
            Explorez nos producteurs et sauvegardez vos fermes préférées
          </p>
          <Link href="/explore">
            <Button variant="default">
              <Globe className="h-4 w-4 mr-2" />
              Explorer les fermes
            </Button>
          </Link>
        </div>
      )}

      {/* Grid des favoris */}
      {loadingState === "success" && favoriteListings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoriteListings.map((listing, index) => (
            <div
              key={listing.id}
              className={cn(
                "group bg-white rounded-xl shadow-md hover:shadow-xl",
                "transition-all duration-300 overflow-hidden",
                "border border-gray-100 hover:border-gray-200"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: "fadeInUp 0.6s ease-out forwards",
              }}
            >
              {/* Image avec overlay */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={getListingImageUrl(listing)}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  alt={escapeHTML(listing.name || "Image de la ferme")}
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

                {/* Bouton favori */}
                <button
                  onClick={() => handleRemoveFavorite(listing.id)}
                  className={cn(
                    "absolute top-3 right-3 p-2 rounded-full",
                    "bg-white/90 hover:bg-white transition-all duration-200",
                    "shadow-md hover:shadow-lg backdrop-blur-sm"
                  )}
                  aria-label="Retirer des favoris"
                >
                  <Heart className="h-4 w-4 text-red-500 fill-current" />
                </button>

                {/* Badge certification */}
                {listing.certifications && (
                  <div className="absolute bottom-3 left-3">
                    <span className="bg-green-500/90 text-white text-xs px-2 py-1 rounded-md backdrop-blur-sm">
                      {/* 🔒 SÉCURITÉ: Certification échappée */}
                      {escapeHTML(String(listing.certifications))}
                    </span>
                  </div>
                )}
              </div>

              {/* Contenu */}
              <div className="p-5 space-y-3">
                <div className="space-y-2">
                  {/* 🔒 SÉCURITÉ: Nom échappé */}
                  <h3 className="font-bold text-lg line-clamp-1">
                    {escapeHTML(listing.name || "Ferme sans nom")}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    {/* 🔒 SÉCURITÉ: Adresse échappée */}
                    <span className="line-clamp-1">
                      {escapeHTML(listing.address || "Adresse non définie")}
                    </span>
                  </div>
                </div>

                {/* Description si disponible */}
                {listing.description && (
                  /* 🔒 SÉCURITÉ: Description sanitisée (permet HTML basique) */
                  <p
                    className="text-sm text-gray-600 line-clamp-2"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(listing.description),
                    }}
                  />
                )}

                {/* Tags produits */}
                <div className="flex flex-wrap gap-2">
                  {listing.product_type && (
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-md px-2 py-1">
                      <Globe className="h-3 w-3" />
                      {/* 🔒 SÉCURITÉ: Type produit échappé */}
                      {escapeHTML(String(listing.product_type))}
                    </span>
                  )}
                  {listing.purchase_mode && (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 rounded-md px-2 py-1">
                      <Globe className="h-3 w-3" />
                      {/* 🔒 SÉCURITÉ: Mode d'achat échappé */}
                      {escapeHTML(String(listing.purchase_mode))}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/farm/${listing.id}`} className="flex-1">
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full group-hover:shadow-md transition-shadow"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message informatif si certains favoris ne sont plus actifs */}
      {favoriteIds.length > favoriteListings.length &&
        loadingState === "success" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>Note:</strong> Certaines fermes de vos favoris ne sont
              plus disponibles ou ont été désactivées.
            </p>
          </div>
        )}
    </div>
  );
}

// ✅ Animations CSS-in-JS pour les cards
const styles = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// Injection des styles (optionnel - peut être mis dans un fichier CSS)
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}
