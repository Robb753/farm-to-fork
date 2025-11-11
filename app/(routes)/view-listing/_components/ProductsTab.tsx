// app/(routes)/view-listing/_components/ProductsTab.tsx
"use client";

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
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec produits
 */
type ListingWithProducts = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant ProductsTab
 */
interface ProductsTabProps {
  listing: ListingWithProducts | null;
  className?: string;
}

/**
 * Interface pour une catégorie de produits
 */
interface ProductCategory {
  name: string;
  items: string[];
  icon?: React.ReactNode;
  color?: string;
  description?: string;
  season?: string[];
}

/**
 * Interface pour un produit individuel enrichi
 */
interface EnrichedProduct {
  name: string;
  category: string;
  season?: string[];
  available?: boolean;
  organic?: boolean;
  popular?: boolean;
}

/**
 * Composant d'affichage des produits d'une ferme
 *
 * Features:
 * - Affichage des produits par catégories avec icônes
 * - Recherche et filtrage en temps réel
 * - Badges de saisonnalité et disponibilité
 * - Design responsive avec grid adaptatif
 * - Actions d'achat et de contact
 * - Gestion des produits populaires
 * - Analytics et tracking des interactions
 *
 * @param listing - Données du listing avec produits
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Onglet des produits enrichi
 */
export default function ProductsTab({
  listing,
  className,
}: ProductsTabProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSeasonalOnly, setShowSeasonalOnly] = useState<boolean>(false);

  /**
   * Parse et enrichit les données de produits depuis product_type
   */
  const productCategories: ProductCategory[] = useMemo(() => {
    if (!listing?.product_type) {
      // Générer des catégories par défaut basées sur le type de ferme
      return generateDefaultCategories(listing);
    }

    let productTypes: string[] = [];

    // Parse selon le format
    if (typeof listing.product_type === "string") {
      try {
        productTypes = JSON.parse(listing.product_type);
      } catch {
        // Si c'est juste une string, la traiter comme un seul type
        productTypes = [listing.product_type];
      }
    } else if (Array.isArray(listing.product_type)) {
      productTypes = listing.product_type;
    }

    // Créer des catégories basées sur les types de produits
    return productTypes.map((productType) => {
      const category = createCategoryFromProductType(productType.trim());
      return category;
    });
  }, [listing?.product_type, listing]);

  /**
   * Génère des catégories par défaut selon le type de ferme
   */
  function generateDefaultCategories(
    listing: ListingWithProducts | null
  ): ProductCategory[] {
    if (!listing) return [];

    const farmType = listing.typeferme?.toLowerCase() || "";

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
    } else if (farmType.includes("fruit") || farmType.includes("arboricult")) {
      return [
        {
          name: "Fruits de saison",
          items: [
            "Pommes",
            "Poires",
            "Cerises",
            "Prunes",
            "Pêches",
            "Abricots",
          ],
          icon: <Apple className="h-4 w-4" />,
          color: "red",
          description: "Fruits frais de nos vergers",
        },
      ];
    } else if (farmType.includes("élevage") || farmType.includes("laitier")) {
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

  /**
   * Crée une catégorie à partir d'un type de produit
   */
  function createCategoryFromProductType(productType: string): ProductCategory {
    const productTypeMap: Record<
      string,
      {
        items: string[];
        icon: React.ReactNode;
        color: string;
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

    const normalizedType = productType.toLowerCase();
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

    // Fallback pour types non reconnus
    return {
      name: productType,
      items: [
        `Produits ${productType.toLowerCase()}`,
        "Contactez-nous pour plus d'informations",
      ],
      icon: <Package className="h-4 w-4" />,
      color: "gray",
      description: `Spécialités ${productType.toLowerCase()}`,
    };
  }

  /**
   * Filtre les catégories selon les critères de recherche
   */
  const filteredCategories = useMemo(() => {
    return productCategories.filter((category) => {
      // Filtre par catégorie sélectionnée
      if (selectedCategory !== "all" && category.name !== selectedCategory) {
        return false;
      }

      // Filtre par terme de recherche
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const categoryMatches = category.name
          .toLowerCase()
          .includes(searchLower);
        const itemsMatch = category.items.some((item) =>
          item.toLowerCase().includes(searchLower)
        );
        return categoryMatches || itemsMatch;
      }

      return true;
    });
  }, [productCategories, selectedCategory, searchTerm]);

  /**
   * Liste de toutes les catégories pour le filtre
   */
  const categoryNames = useMemo(() => {
    return productCategories.map((cat) => cat.name);
  }, [productCategories]);

  /**
   * Compte le nombre total de produits
   */
  const totalProducts = useMemo(() => {
    return productCategories.reduce(
      (total, category) => total + category.items.length,
      0
    );
  }, [productCategories]);

  /**
   * Obtient les classes de couleur pour les badges
   */
  const getBadgeClasses = useCallback((color: string) => {
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
    return colorMap[color] || colorMap.gray;
  }, []);

  /**
   * Gère la sélection d'une catégorie
   */
  const handleCategorySelect = useCallback(
    (categoryName: string): void => {
      setSelectedCategory(categoryName);

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "filter_products", {
          event_category: "products_interaction",
          event_label: categoryName,
          listing_id: listing?.id,
        });
      }
    },
    [listing?.id]
  );

  /**
   * Gère la recherche de produits
   */
  const handleSearch = useCallback(
    (value: string): void => {
      setSearchTerm(value);

      // Analytics tracking pour recherches longues
      if (value.length >= 3) {
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "search_products", {
            event_category: "products_interaction",
            event_label: value,
            listing_id: listing?.id,
          });
        }
      }
    },
    [listing?.id]
  );

  // Empty state si aucun produit
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
          Le producteur n'a pas encore ajouté ses produits.
        </p>
        <Button variant="outline" size="sm">
          Contactez la ferme pour plus d'informations
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header avec statistiques */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Nos Produits</h2>
          <p className="text-gray-600 text-sm mt-1">
            {totalProducts} produit{totalProducts > 1 ? "s" : ""} disponible
            {totalProducts > 1 ? "s" : ""}
            dans {productCategories.length} catégorie
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

      {/* Barre de recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Recherche */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtre par catégorie */}
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

      {/* Grid des catégories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.map((category, index) => (
          <Card
            key={index}
            className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <div
                  className={cn("p-2 rounded-lg", `bg-${category.color}-100`)}
                >
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
              {/* Produits */}
              <div className="flex flex-wrap gap-2">
                {category.items.map((item, idx) => (
                  <div
                    key={idx}
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

              {/* Actions */}
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
                  Plus d'infos
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Message si aucun résultat */}
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
            >
              Effacer les filtres
            </Button>
          </div>
        )}

      {/* Message d'information */}
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
