// app/(routes)/view-listing/_components/ProductsTab.tsx
"use client";

import React, { useMemo, useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Apple,
  Carrot,
  Wheat,
  Milk,
  Egg,
  Flower,
  Search,
  ShoppingBasket,
  Calendar,
  Filter,
  Package,
} from "@/utils/icons";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

type ListingWithProducts = Database["public"]["Tables"]["listing"]["Row"];

interface ProductsTabProps {
  listing: ListingWithProducts | null;
  className?: string;
}

interface ProductCategory {
  name: string;
  items: string[];
  icon?: React.ReactNode;
  color?: string;
  description?: string;
  season?: string[];
}

type BadgeColor =
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple"
  | "pink"
  | "amber"
  | "brown"
  | "gray";

/** Helpers purs */
function safeParseStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
      return [value];
    } catch {
      return [value];
    }
  }
  return [];
}

function generateDefaultCategoriesFromFarmType(
  typeferme?: string | null
): ProductCategory[] {
  const farmType = (typeferme ?? "").toLowerCase();

  if (farmType.includes("maraîch") || farmType.includes("légume")) {
    return [
      {
        name: "Légumes de saison",
        items: [
          "Tomates",
          "Courgettes",
          "Carottes",
          "Radis",
          "Salade",
          "Épinards",
        ],
        icon: <Carrot className="h-4 w-4" />,
        color: "orange",
        description: "Légumes frais cultivés sur notre exploitation",
      },
    ];
  }

  if (farmType.includes("fruit") || farmType.includes("arboricult")) {
    return [
      {
        name: "Fruits de saison",
        items: ["Pommes", "Poires", "Cerises", "Prunes", "Pêches", "Abricots"],
        icon: <Apple className="h-4 w-4" />,
        color: "red",
        description: "Fruits frais de nos vergers",
      },
    ];
  }

  if (farmType.includes("élevage") || farmType.includes("laitier")) {
    return [
      {
        name: "Produits laitiers",
        items: ["Lait frais", "Fromage blanc", "Yaourts", "Beurre", "Crème"],
        icon: <Milk className="h-4 w-4" />,
        color: "blue",
        description: "Produits laitiers de nos vaches",
      },
    ];
  }

  return [
    {
      name: "Produits de la ferme",
      items: ["Contactez-nous pour connaître nos produits disponibles"],
      icon: <Package className="h-4 w-4" />,
      color: "gray",
    },
  ];
}

function createCategoryFromProductType(
  productTypeRaw: string
): ProductCategory {
  const productType = productTypeRaw.trim();
  const normalizedType = productType.toLowerCase();

  const productTypeMap: Record<
    string,
    {
      items: string[];
      icon: React.ReactNode;
      color: BadgeColor;
      description: string;
    }
  > = {
    légumes: {
      items: [
        "Tomates",
        "Courgettes",
        "Carottes",
        "Radis",
        "Salade",
        "Épinards",
        "Poireaux",
        "Choux",
      ],
      icon: <Carrot className="h-4 w-4" />,
      color: "orange",
      description: "Légumes frais de saison",
    },
    fruits: {
      items: [
        "Pommes",
        "Poires",
        "Cerises",
        "Prunes",
        "Pêches",
        "Abricots",
        "Fraises",
        "Framboises",
      ],
      icon: <Apple className="h-4 w-4" />,
      color: "red",
      description: "Fruits de nos vergers",
    },
    céréales: {
      items: ["Blé", "Orge", "Avoine", "Seigle", "Maïs", "Quinoa"],
      icon: <Wheat className="h-4 w-4" />,
      color: "yellow",
      description: "Céréales cultivées sur notre exploitation",
    },
    laitiers: {
      items: [
        "Lait frais",
        "Fromage blanc",
        "Yaourts",
        "Beurre",
        "Crème",
        "Fromages",
      ],
      icon: <Milk className="h-4 w-4" />,
      color: "blue",
      description: "Produits laitiers de nos vaches",
    },
    œufs: {
      items: ["Œufs de poules", "Œufs bio", "Œufs plein air"],
      icon: <Egg className="h-4 w-4" />,
      color: "amber",
      description: "Œufs frais de nos poules",
    },
    volailles: {
      items: ["Poulets", "Canards", "Oies", "Dindes"],
      icon: <Egg className="h-4 w-4" />,
      color: "brown",
      description: "Volailles élevées en plein air",
    },
    fleurs: {
      items: ["Bouquets champêtres", "Fleurs coupées", "Plantes aromatiques"],
      icon: <Flower className="h-4 w-4" />,
      color: "pink",
      description: "Fleurs et plantes de notre jardin",
    },
  };

  const match = Object.keys(productTypeMap).find((key) =>
    normalizedType.includes(key)
  );

  if (match) {
    const typeData = productTypeMap[match];
    return {
      name: productType,
      items: typeData.items,
      icon: typeData.icon,
      color: typeData.color,
      description: typeData.description,
    };
  }

  return {
    name: productType,
    items: [
      `Produits ${normalizedType}`,
      "Contactez-nous pour plus d'informations",
    ],
    icon: <Package className="h-4 w-4" />,
    color: "gray",
    description: `Spécialités ${normalizedType}`,
  };
}

function getBadgeClasses(color: string): string {
  const colorMap: Record<string, string> = {
    red: "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    orange:
      "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
    yellow:
      "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
    green: "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
    blue: "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
    purple:
      "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
    pink: "bg-pink-100 text-pink-700 border-pink-200 hover:bg-pink-200",
    amber: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
    brown: "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200",
  };
  return colorMap[color] ?? colorMap.gray;
}

export default function ProductsTab({
  listing,
  className,
}: ProductsTabProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSeasonalOnly, setShowSeasonalOnly] = useState(false);

  const listingId = listing?.id;

  // ✅ Dépendances primitives
  const farmType = listing?.typeferme ?? "";
  const productTypeRaw = listing?.product_type;

  const productCategories: ProductCategory[] = useMemo(() => {
    // Pas de listing => vide
    if (!listing) return [];

    const productTypes = safeParseStringArray(productTypeRaw);

    if (productTypes.length === 0) {
      return generateDefaultCategoriesFromFarmType(farmType);
    }

    return productTypes.map((t) => createCategoryFromProductType(String(t)));
  }, [farmType, listing, productTypeRaw]); // ✅ plus d'“unnecessary deps” signalées

  const filteredCategories = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();

    return productCategories.filter((category) => {
      if (selectedCategory !== "all" && category.name !== selectedCategory)
        return false;

      if (showSeasonalOnly) {
        // TODO: filtrer quand tu auras season[] réels
      }

      if (!searchLower) return true;

      const categoryMatches = category.name.toLowerCase().includes(searchLower);
      const itemsMatch = category.items.some((item) =>
        item.toLowerCase().includes(searchLower)
      );
      return categoryMatches || itemsMatch;
    });
  }, [productCategories, selectedCategory, searchTerm, showSeasonalOnly]);

  const categoryNames = useMemo(
    () => productCategories.map((cat) => cat.name),
    [productCategories]
  );

  const totalProducts = useMemo(() => {
    return productCategories.reduce(
      (total, category) => total + category.items.length,
      0
    );
  }, [productCategories]);

  const handleCategorySelect = useCallback(
    (categoryName: string): void => {
      setSelectedCategory(categoryName);

      const w = window as unknown as { gtag?: (...args: any[]) => void };
      if (typeof w.gtag === "function") {
        w.gtag("event", "filter_products", {
          event_category: "products_interaction",
          event_label: categoryName,
          listing_id: listingId,
        });
      }
    },
    [listingId]
  );

  const handleSearch = useCallback(
    (value: string): void => {
      setSearchTerm(value);

      if (value.length >= 3) {
        const w = window as unknown as { gtag?: (...args: any[]) => void };
        if (typeof w.gtag === "function") {
          w.gtag("event", "search_products", {
            event_category: "products_interaction",
            event_label: value,
            listing_id: listingId,
          });
        }
      }
    },
    [listingId]
  );

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("all");
    setShowSeasonalOnly(false);
  }, []);

  if (productCategories.length === 0) {
    return (
      <div className={cn("text-center py-12 bg-gray-50 rounded-xl", className)}>
        <div className="bg-gray-200 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <ShoppingBasket className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Catalogue en préparation
        </h3>
        <p className="text-gray-500 mb-4">
          Le producteur n&apos;a pas encore ajouté ses produits.
        </p>
        <Button variant="outline" size="sm">
          Contactez la ferme pour plus d&apos;informations
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nos Produits</h2>
          <p className="text-gray-600 text-sm mt-1">
            {totalProducts} produit{totalProducts > 1 ? "s" : ""} disponible
            {totalProducts > 1 ? "s" : ""} dans {productCategories.length}{" "}
            catégorie
            {productCategories.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 border-green-200"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Produits de saison
          </Badge>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategorySelect("all")}
            className="whitespace-nowrap"
          >
            <Filter className="h-3 w-3 mr-1" />
            Toutes les catégories
          </Button>

          {categoryNames.map((categoryName) => (
            <Button
              key={categoryName}
              variant={
                selectedCategory === categoryName ? "default" : "outline"
              }
              size="sm"
              onClick={() => handleCategorySelect(categoryName)}
              className="whitespace-nowrap"
            >
              {categoryName}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.map((category) => (
          <Card
            key={category.name}
            className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <div className="p-2 rounded-lg bg-gray-100">
                  {category.icon}
                </div>

                <div className="flex-1">
                  <div className="font-semibold text-lg">{category.name}</div>
                  {category.description && (
                    <div className="text-sm text-gray-500 mt-1">
                      {category.description}
                    </div>
                  )}
                </div>

                <Badge variant="outline" className="text-xs">
                  {category.items.length} produit
                  {category.items.length > 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {category.items.map((item) => (
                  <div
                    key={`${category.name}-${item}`}
                    title={`${item} - ${category.name}`}
                    className="inline-block"
                  >
                    <Badge
                      className={cn(
                        "transition-all duration-200 hover:shadow-sm cursor-pointer",
                        getBadgeClasses(category.color || "gray")
                      )}
                    >
                      {item}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <ShoppingBasket className="h-3 w-3 mr-1" />
                  Commander
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Plus d&apos;infos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCategories.length === 0 &&
        (searchTerm || selectedCategory !== "all") && (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun produit trouvé
            </h3>
            <p className="text-gray-500 mb-4">
              Essayez de modifier vos critères de recherche ou contactez la
              ferme directement.
            </p>
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Effacer les filtres
            </Button>
          </div>
        )}

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
        <p className="text-blue-800 text-sm text-center">
          💡 <strong>Info :</strong> Les produits disponibles peuvent varier
          selon la saison. Contactez directement la ferme pour connaître la
          disponibilité actuelle.
        </p>
      </div>
    </div>
  );
}
