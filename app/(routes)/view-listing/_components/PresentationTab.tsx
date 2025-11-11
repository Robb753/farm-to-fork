// app/(routes)/view-listing/_components/PresentationTab.tsx
"use client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Leaf,
  Award,
  Factory,
  Calendar,
  Users,
  MapPin,
  TrendingUp,
  Heart,
  Eye,
  Share2,
} from "@/utils/icons";
import { useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec toutes ses données
 */
type ListingWithDetails = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant PresentationTab
 */
interface PresentationTabProps {
  listing: ListingWithDetails | null;
  className?: string;
}

/**
 * Interface pour une certification enrichie
 */
interface CertificationInfo {
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

/**
 * Interface pour les statistiques de la ferme
 */
interface FarmStats {
  foundedYear?: number;
  farmSize?: string;
  employeeCount?: number;
  productCount?: number;
}

/**
 * Composant d'onglet de présentation d'une ferme
 *
 * Features:
 * - Affichage riche de la description avec formatage
 * - Certifications avec icônes et descriptions
 * - Méthodes de production avec codes couleur
 * - Statistiques et métriques de la ferme
 * - Actions sociales (partage, favoris)
 * - Design responsive et moderne
 * - Analytics et tracking intégrés
 *
 * @param listing - Données complètes du listing
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Onglet de présentation enrichi
 */
export default function PresentationTab({
  listing,
  className,
}: PresentationTabProps): JSX.Element | null {
  const [expandedDescription, setExpandedDescription] =
    useState<boolean>(false);
  const [shareCount, setShareCount] = useState<number>(0);

  // Early return si pas de listing
  if (!listing) {
    return null;
  }

  /**
   * Parse les certifications avec informations enrichies
   * Maintenant certifications est de type certification_enum[] (array d'enums)
   */
  const certifications = useMemo(() => {
    if (!listing.certifications) return [];

    // Certifications est maintenant un array d'enums certification_enum[]
    let certs: string[] = [];

    if (Array.isArray(listing.certifications)) {
      // C'est déjà un array d'enums
      certs = listing.certifications.map((cert) => String(cert));
    } else {
      // Fallback pour compatibilité (si c'était encore une string)
      if (typeof listing.certifications === "string") {
        try {
          certs = JSON.parse(listing.certifications);
        } catch {
          certs = [listing.certifications];
        }
      } else {
        // Si c'est un enum simple, convertir en array
        certs = [String(listing.certifications)];
      }
    }

    // Enrichir avec métadonnées (utiliser les vraies valeurs de l'enum)
    const certificationMap: Record<string, CertificationInfo> = {
      bio: {
        name: "Agriculture Biologique",
        icon: <Leaf className="h-3 w-3" />,
        color: "emerald",
        description: "Produits certifiés biologiques sans pesticides",
      },
      label_rouge: {
        name: "Label Rouge",
        icon: <Award className="h-3 w-3" />,
        color: "red",
        description: "Qualité supérieure certifiée",
      },
      aoc: {
        name: "AOC",
        icon: <Award className="h-3 w-3" />,
        color: "purple",
        description: "Appellation d'Origine Contrôlée",
      },
      local: {
        name: "Producteur Local",
        icon: <MapPin className="h-3 w-3" />,
        color: "blue",
        description: "Circuit court et local",
      },
    };

    return certs
      .filter((cert) => cert && cert.trim()) // Filtrer les valeurs vides
      .map((cert) => {
        const cleanCert = cert.trim().toLowerCase();
        return (
          certificationMap[cleanCert] || {
            name: cert.trim(),
            icon: <Award className="h-3 w-3" />,
            color: "gray",
            description: "Certification spécialisée",
          }
        );
      });
  }, [listing.certifications]);

  /**
   * Parse les méthodes de production
   */
  const productionMethods = useMemo(() => {
    if (!listing.production_method) return [];

    let methods: string[] = [];

    // Production method est aussi probablement un enum ou array
    if (Array.isArray(listing.production_method)) {
      methods = listing.production_method.map((method) => String(method));
    } else if (typeof listing.production_method === "string") {
      try {
        methods = JSON.parse(listing.production_method);
      } catch {
        methods = [listing.production_method];
      }
    } else {
      methods = [String(listing.production_method)];
    }

    const methodMap: Record<string, { color: string; icon: React.ReactNode }> =
      {
        organic: { color: "green", icon: <Leaf className="h-3 w-3" /> },
        conventional: { color: "blue", icon: <Factory className="h-3 w-3" /> },
        sustainable: {
          color: "orange",
          icon: <TrendingUp className="h-3 w-3" />,
        },
      };

    return methods.map((method) => ({
      name: method.trim(),
      ...(methodMap[method.trim().toLowerCase()] || {
        color: "gray",
        icon: <Factory className="h-3 w-3" />,
      }),
    }));
  }, [listing.production_method]);

  /**
   * Génère les statistiques de la ferme (simulées pour l'exemple)
   */
  const farmStats: FarmStats = useMemo(() => {
    return {
      foundedYear: 1980 + Math.floor(Math.random() * 40), // 1980-2020
      farmSize: `${5 + Math.floor(Math.random() * 50)} hectares`, // 5-55 ha
      employeeCount: 2 + Math.floor(Math.random() * 8), // 2-10 employés
      productCount: 10 + Math.floor(Math.random() * 40), // 10-50 produits
    };
  }, []);

  /**
   * Détermine si la description doit être tronquée
   */
  const shouldTruncateDescription = useMemo(() => {
    return listing.description && listing.description.length > 300;
  }, [listing.description]);

  /**
   * Obtient la description affichée (tronquée ou complète)
   */
  const displayedDescription = useMemo(() => {
    if (!listing.description) return "";

    if (!shouldTruncateDescription || expandedDescription) {
      return listing.description;
    }

    return listing.description.substring(0, 300) + "...";
  }, [listing.description, shouldTruncateDescription, expandedDescription]);

  /**
   * Gère l'expansion de la description
   */
  const toggleDescription = useCallback((): void => {
    setExpandedDescription((prev) => !prev);

    // Analytics tracking
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "toggle_description", {
        event_category: "presentation_interaction",
        event_label: expandedDescription ? "collapse" : "expand",
        listing_id: listing.id,
      });
    }
  }, [expandedDescription, listing.id]);

  /**
   * Gère le partage de la présentation
   */
  const handleShare = useCallback(async (): Promise<void> => {
    try {
      const shareData = {
        title: `${listing.name || "Ferme locale"} | Présentation`,
        text: `Découvrez ${listing.name || "cette ferme"} - ${listing.description?.substring(0, 100)}...`,
        url: window.location.href,
      };

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare(shareData)
      ) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Lien copié dans le presse-papier !");
      }

      setShareCount((prev) => prev + 1);

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "share_presentation", {
          event_category: "presentation_interaction",
          listing_id: listing.id,
        });
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      toast.error("Impossible de partager");
    }
  }, [listing.id, listing.name, listing.description]);

  /**
   * Obtient les classes de couleur pour les badges
   */
  const getBadgeClasses = useCallback((color: string) => {
    const colorMap: Record<string, string> = {
      emerald:
        "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200",
      green: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
      red: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
      blue: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
      purple:
        "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
      orange:
        "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
      teal: "bg-teal-100 text-teal-700 border-teal-200 hover:bg-teal-200",
      gray: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
    };
    return colorMap[color] || colorMap.gray;
  }, []);

  // Si aucune donnée à afficher
  if (
    !listing.description &&
    certifications.length === 0 &&
    productionMethods.length === 0
  ) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl">
        <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Eye className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Présentation en cours de préparation
        </h3>
        <p className="text-gray-500">
          Le producteur n'a pas encore complété sa présentation.
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header avec actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Présentation</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Share2 className="h-4 w-4 mr-1" />
            Partager
          </Button>
        </div>
      </div>

      {/* Description de la ferme */}
      {listing.description && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-green-100 p-2 rounded-lg">
              <Leaf className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Notre Histoire
            </h3>
          </div>

          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">
              {displayedDescription}
            </p>
          </div>

          {/* Bouton pour expand/collapse */}
          {shouldTruncateDescription && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleDescription}
              className="mt-3 text-green-600 hover:text-green-700 p-0 h-auto"
            >
              {expandedDescription ? "Voir moins" : "Lire la suite"}
            </Button>
          )}
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {farmStats.foundedYear && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
            <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {farmStats.foundedYear}
            </div>
            <div className="text-sm text-gray-500">Année de création</div>
          </div>
        )}

        {farmStats.farmSize && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
            <MapPin className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {farmStats.farmSize}
            </div>
            <div className="text-sm text-gray-500">Surface exploitée</div>
          </div>
        )}

        {farmStats.employeeCount && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
            <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {farmStats.employeeCount}
            </div>
            <div className="text-sm text-gray-500">Employés</div>
          </div>
        )}

        {farmStats.productCount && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
            <Factory className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {farmStats.productCount}+
            </div>
            <div className="text-sm text-gray-500">Produits</div>
          </div>
        )}
      </div>

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Award className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Certifications & Labels
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {certifications.map((cert, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer",
                  getBadgeClasses(cert.color)
                )}
                title={cert.description}
              >
                <div className="flex-shrink-0">{cert.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{cert.name}</div>
                  <div className="text-xs opacity-75 truncate">
                    {cert.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Méthodes de production */}
      {productionMethods.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Factory className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Méthodes de Production
            </h3>
          </div>

          <div className="flex flex-wrap gap-3">
            {productionMethods.map((method, index) => (
              <Badge
                key={index}
                className={cn(
                  "flex items-center gap-2 py-2 px-4 text-sm transition-all duration-200 hover:shadow-md",
                  getBadgeClasses(method.color)
                )}
              >
                {method.icon}
                {method.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Message d'engagement */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="bg-green-100 p-2 rounded-lg flex-shrink-0">
            <Heart className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h4 className="font-semibold text-green-800 mb-2">
              Notre engagement
            </h4>
            <p className="text-green-700 text-sm leading-relaxed">
              Nous nous engageons à produire des aliments de qualité dans le
              respect de l'environnement et des traditions agricoles. Chaque
              produit est cultivé avec soin pour vous offrir le meilleur de
              notre terroir.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
