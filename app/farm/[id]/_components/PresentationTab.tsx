"use client";

import { Badge } from "@/components/ui/badge";
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
import { useState, useMemo, useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";
import { escapeHTML, sanitizeHTML } from "@/lib/utils/sanitize";

type ListingWithDetails = Database["public"]["Tables"]["listing"]["Row"];

interface PresentationTabProps {
  listing: ListingWithDetails | null;
  className?: string;
}

interface CertificationInfo {
  name: string;
  icon: ReactNode;
  color: string;
  description: string;
}

interface FarmStats {
  foundedYear?: number;
  farmSize?: string;
  employeeCount?: number;
  productCount?: number;
}

function normalizeToStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed))
        return parsed.map((v) => String(v)).filter(Boolean);
    } catch {
      // ignore
    }
    return [value].filter(Boolean);
  }

  return [String(value)].filter(Boolean);
}

export default function PresentationTab({
  listing,
  className,
}: PresentationTabProps): JSX.Element | null {
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [_shareCount, setShareCount] = useState(0);

  // ✅ Toujours définir des valeurs stables même si listing est null
  const listingId = listing?.id ?? 0;
  const listingName = listing?.name ?? "Ferme locale";
  const listingDescription = listing?.description ?? "";

  const certifications = useMemo<CertificationInfo[]>(() => {
    if (!listing) return [];

    const certs = normalizeToStringArray(listing.certifications)
      .map((s) => s.trim())
      .filter(Boolean);

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

    return certs.map((cert) => {
      const key = cert.toLowerCase();
      return (
        certificationMap[key] || {
          name: escapeHTML(cert),
          icon: <Award className="h-3 w-3" />,
          color: "gray",
          description: "Certification spécialisée",
        }
      );
    });
  }, [listing]);

  const productionMethods = useMemo(() => {
    if (!listing) return [];

    const methods = normalizeToStringArray(listing.production_method)
      .map((s) => s.trim())
      .filter(Boolean);

    const methodMap: Record<string, { color: string; icon: ReactNode }> = {
      organic: { color: "green", icon: <Leaf className="h-3 w-3" /> },
      conventional: { color: "blue", icon: <Factory className="h-3 w-3" /> },
      sustainable: {
        color: "orange",
        icon: <TrendingUp className="h-3 w-3" />,
      },
    };

    return methods.map((method) => {
      const key = method.toLowerCase();
      return {
        name: escapeHTML(method),
        ...(methodMap[key] || {
          color: "gray",
          icon: <Factory className="h-3 w-3" />,
        }),
      };
    });
  }, [listing]);

  const farmStats = useMemo<FarmStats>(() => {
    if (!listing) return {};

    const foundedFromDb =
      typeof (listing as any).founded_year === "number"
        ? (listing as any).founded_year
        : undefined;

    const foundedFromCreatedAt = (() => {
      const raw = (listing as any).created_at;
      if (!raw) return undefined;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) return undefined;
      return d.getFullYear();
    })();

    return {
      foundedYear: foundedFromDb ?? foundedFromCreatedAt,
      farmSize: (listing as any).farm_size ?? undefined,
      employeeCount: (listing as any).employee_count ?? undefined,
      productCount: (listing as any).product_count ?? undefined,
    };
  }, [listing]);

  const shouldTruncateDescription = useMemo(() => {
    return listingDescription.length > 300;
  }, [listingDescription]);

  const displayedDescription = useMemo(() => {
    if (!listingDescription) return "";
    if (!shouldTruncateDescription || expandedDescription)
      return listingDescription;
    return listingDescription.substring(0, 300) + "...";
  }, [listingDescription, shouldTruncateDescription, expandedDescription]);

  const toggleDescription = useCallback(() => {
    setExpandedDescription((prev) => {
      const next = !prev;

      const gtag = (globalThis as any)?.gtag;
      if (typeof gtag === "function") {
        gtag("event", "toggle_description", {
          event_category: "presentation_interaction",
          event_label: next ? "expand" : "collapse",
          listing_id: listingId,
        });
      }

      return next;
    });
  }, [listingId]);

  const handleShare = useCallback(async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.href : "";
      const shareData = {
        title: `${escapeHTML(listingName)} | Présentation`,
        text: `Découvrez ${escapeHTML(listingName)} - ${escapeHTML(
          listingDescription.substring(0, 100)
        )}...`,
        url,
      };

      const nav = typeof navigator !== "undefined" ? navigator : null;

      if (nav?.share && nav?.canShare && nav.canShare(shareData as any)) {
        await nav.share(shareData as any);
      } else if (nav?.clipboard?.writeText) {
        await nav.clipboard.writeText(url);
        toast.success("Lien copié dans le presse-papier !");
      } else {
        toast.success("Partage non supporté sur cet appareil.");
      }

      setShareCount((prev) => prev + 1);

      const gtag = (globalThis as any)?.gtag;
      if (typeof gtag === "function") {
        gtag("event", "share_presentation", {
          event_category: "presentation_interaction",
          listing_id: listingId,
        });
      }
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      toast.error("Impossible de partager");
    }
  }, [listingId, listingName, listingDescription]);

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

  // ✅ Maintenant on peut return conditionnellement : TOUS les hooks ont déjà été appelés
  if (!listing) return null;

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
            <div
              className="text-gray-700 leading-relaxed whitespace-pre-line prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: sanitizeHTML(displayedDescription),
              }}
            />
          </div>

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

      {/* Stats */}
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
            {/* 🔒 SÉCURITÉ: farmSize échappé */}
            <div className="text-2xl font-bold text-gray-900">
              {escapeHTML(String(farmStats.farmSize))}
            </div>
            <div className="text-sm text-gray-500">Surface exploitée</div>
          </div>
        )}

        {farmStats.employeeCount && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
            <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            {/* 🔒 SÉCURITÉ: employeeCount échappé */}
            <div className="text-2xl font-bold text-gray-900">
              {escapeHTML(String(farmStats.employeeCount))}
            </div>
            <div className="text-sm text-gray-500">Employés</div>
          </div>
        )}

        {farmStats.productCount && (
          <div className="bg-white rounded-lg p-4 border border-gray-100 text-center">
            <Factory className="h-6 w-6 text-orange-600 mx-auto mb-2" />
            {/* 🔒 SÉCURITÉ: productCount échappé */}
            <div className="text-2xl font-bold text-gray-900">
              {escapeHTML(String(farmStats.productCount))}+
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
                key={`${cert.name}-${index}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer",
                  getBadgeClasses(cert.color)
                )}
                title={cert.description}
              >
                <div className="flex-shrink-0">{cert.icon}</div>
                <div className="flex-1 min-w-0">
                  {/* 🔒 SÉCURITÉ: cert.name déjà échappé dans useMemo */}
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
                key={`${method.name}-${index}`}
                className={cn(
                  "flex items-center gap-2 py-2 px-4 text-sm transition-all duration-200 hover:shadow-md",
                  getBadgeClasses(method.color)
                )}
              >
                {method.icon}
                {/* 🔒 SÉCURITÉ: method.name déjà échappé dans useMemo */}
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
