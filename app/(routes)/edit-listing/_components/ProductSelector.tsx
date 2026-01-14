"use client";

import React, { useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import vegetables from "@/app/_data/vegetables.json";
import fruits from "@/app/_data/fruits.json";
import dairyProducts from "@/app/_data/dairy-products.json";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour ProductSelector
 */
interface Product {
  name: string;
  category: string;
  type: string;
  labels: string[];
}

interface ProductSelectorProps {
  /** Types de produits sélectionnés (Légumes, Fruits, etc.) */
  selectedTypes: string[];
  /** Produits spécifiques sélectionnés */
  selectedProducts: string[];
  /** Callback appelé lors du changement de sélection */
  onChange: (products: string[]) => void;
  /** Classe CSS personnalisée */
  className?: string;
  /** Mode de sélection (simple ou multiple) */
  selectionMode?: "single" | "multiple";
  /** Afficher les labels des produits */
  showLabels?: boolean;
  /** Taille maximale de sélection */
  maxSelection?: number;
}

interface ProductTypeData {
  [key: string]: Product[];
}

interface ProductStats {
  selectedCount: number;
  totalCount: number;
  allSelected: boolean;
  partiallySelected: boolean;
}

/**
 * Configuration des données de produits
 */
const PRODUCT_DATA: ProductTypeData = {
  Légumes: vegetables as Product[],
  Fruits: fruits as Product[],
  "Produits laitiers": dairyProducts as Product[],
};

/**
 * Configuration des icônes par type de produit
 */
const PRODUCT_ICONS: Record<string, string> = {
  Légumes: "🥕",
  Fruits: "🍎",
  "Produits laitiers": "🥛",
};

/**
 * ✅ Fonction pure (pas un hook)
 * Calcule les stats d’un type en fonction de la sélection actuelle
 */
function getProductStats(
  type: string,
  selectedProducts: string[]
): ProductStats {
  const products = PRODUCT_DATA[type] || [];
  const productNames = products.map((p) => p.name);

  const selectedCount = productNames.filter((name) =>
    selectedProducts.includes(name)
  ).length;

  const totalCount = products.length;
  const allSelected = selectedCount === totalCount && totalCount > 0;
  const partiallySelected = selectedCount > 0 && selectedCount < totalCount;

  return {
    selectedCount,
    totalCount,
    allSelected,
    partiallySelected,
  };
}

/**
 * Hook pour la gestion de la sélection de produits
 */
const useProductSelection = (
  selectedProducts: string[],
  onChange: (products: string[]) => void,
  maxSelection?: number
) => {
  const handleProductToggle = useCallback(
    (productName: string): void => {
      const isSelected = selectedProducts.includes(productName);

      if (
        !isSelected &&
        maxSelection &&
        selectedProducts.length >= maxSelection
      ) {
        console.warn(
          `Limite de sélection atteinte: ${maxSelection} produits maximum`
        );
        return;
      }

      const newProducts = isSelected
        ? selectedProducts.filter((p) => p !== productName)
        : [...selectedProducts, productName];

      onChange(newProducts);
    },
    [selectedProducts, onChange, maxSelection]
  );

  const handleToggleAllForType = useCallback(
    (type: string): void => {
      const products = PRODUCT_DATA[type] || [];
      const productNames = products.map((p) => p.name);
      const allSelected = productNames.every((name) =>
        selectedProducts.includes(name)
      );

      let newProducts: string[];
      if (allSelected) {
        // Désélectionner tous les produits de ce type
        newProducts = selectedProducts.filter((p) => !productNames.includes(p));
      } else {
        // Sélectionner tous les produits de ce type (avec limite)
        const combinedProducts = [...selectedProducts, ...productNames];
        const uniqueProducts = Array.from(new Set(combinedProducts));

        if (maxSelection && uniqueProducts.length > maxSelection) {
          console.warn(
            `Limite de sélection atteinte: ${maxSelection} produits maximum`
          );
          newProducts = uniqueProducts.slice(0, maxSelection);
        } else {
          newProducts = uniqueProducts;
        }
      }

      onChange(newProducts);
    },
    [selectedProducts, onChange, maxSelection]
  );

  return {
    handleProductToggle,
    handleToggleAllForType,
  };
};

/**
 * Composant d'état vide
 */
const EmptyState: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="text-4xl mb-2">🥕</div>
      <p style={{ color: COLORS.TEXT_MUTED }}>
        Sélectionnez d'abord les types de produits ci-dessus
      </p>
    </div>
  </div>
);

/**
 * Composant de résumé global
 */
interface GlobalSummaryProps {
  selectedCount: number;
  maxSelection?: number;
}

const GlobalSummary: React.FC<GlobalSummaryProps> = ({
  selectedCount,
  maxSelection,
}) => (
  <Card
    className="border"
    style={{
      backgroundColor: COLORS.SUCCESS_BG,
      borderColor: COLORS.SUCCESS + "30",
    }}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: COLORS.SUCCESS }}>
            Total sélectionné
          </p>
          <p className="text-lg font-bold" style={{ color: COLORS.SUCCESS }}>
            {selectedCount} produit{selectedCount > 1 ? "s" : ""}
            {maxSelection && ` / ${maxSelection}`}
          </p>
          {maxSelection && selectedCount >= maxSelection && (
            <p className="text-xs mt-1" style={{ color: COLORS.WARNING }}>
              Limite atteinte
            </p>
          )}
        </div>
        <div className="text-2xl">✅</div>
      </div>
    </CardContent>
  </Card>
);

/**
 * Composant de produit individuel
 */
interface ProductItemProps {
  product: Product;
  isSelected: boolean;
  onToggle: () => void;
  showLabels: boolean;
}

const ProductItem: React.FC<ProductItemProps> = ({
  product,
  isSelected,
  onToggle,
  showLabels,
}) => (
  <div
    onClick={onToggle}
    className={cn(
      "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
      isSelected
        ? "border-green-300 bg-green-50"
        : "border-gray-200 hover:border-gray-300"
    )}
    style={
      isSelected
        ? {
            borderColor: COLORS.SUCCESS + "50",
            backgroundColor: COLORS.SUCCESS_BG,
          }
        : {
            borderColor: COLORS.BORDER,
          }
    }
  >
    <div className="flex items-start gap-3">
      <input
        type="checkbox"
        id={`product-${product.name}`}
        name={`specific-product-${product.name.replace(/\s+/g, "-").toLowerCase()}`}
        checked={isSelected}
        onChange={() => {}}
        className="mt-0.5 h-4 w-4 rounded pointer-events-none"
        style={{
          accentColor: COLORS.SUCCESS,
        }}
        aria-label={`Sélectionner ${product.name}`}
      />

      <div className="flex-1">
        <span
          className="text-sm font-medium block"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {product.name}
        </span>

        {showLabels && product.labels && product.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {product.labels.map((label) => (
              <Badge
                key={label}
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                {label}
              </Badge>
            ))}
          </div>
        )}

        {product.category && product.category !== product.type && (
          <span
            className="text-xs block mt-1"
            style={{ color: COLORS.TEXT_MUTED }}
          >
            {product.category}
          </span>
        )}
      </div>
    </div>
  </div>
);

/**
 * Composant ProductSelector principal
 */
const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedTypes,
  selectedProducts,
  onChange,
  className = "",
  showLabels = true,
  maxSelection,
}) => {
  const { handleProductToggle, handleToggleAllForType } = useProductSelection(
    selectedProducts,
    onChange,
    maxSelection
  );

  // ✅ Pré-calcule des stats au top-level (pas dans le .map)
  const statsByType = useMemo(() => {
    const map: Record<string, ProductStats> = {};
    selectedTypes.forEach((type) => {
      map[type] = getProductStats(type, selectedProducts);
    });
    return map;
  }, [selectedTypes, selectedProducts]);

  // État vide si aucun type sélectionné
  if (selectedTypes.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {selectedTypes.map((type) => {
        const products = PRODUCT_DATA[type] || [];
        const stats = statsByType[type] ?? {
          selectedCount: 0,
          totalCount: products.length,
          allSelected: false,
          partiallySelected: false,
        };

        if (products.length === 0) {
          return (
            <Card key={type} style={{ borderColor: COLORS.BORDER }}>
              <CardContent
                className="p-4 text-center"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Aucun produit disponible pour {type}
              </CardContent>
            </Card>
          );
        }

        return (
          <Card
            key={type}
            className="hover:shadow-md transition-shadow"
            style={{ borderColor: COLORS.BORDER }}
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle
                  className="flex items-center gap-2"
                  style={{ color: COLORS.PRIMARY }}
                >
                  <span>{PRODUCT_ICONS[type] || "📦"}</span>
                  Quels {type.toLowerCase()} proposez-vous ?
                  <Badge
                    variant={stats.selectedCount > 0 ? "success" : "secondary"}
                    className={
                      stats.selectedCount > 0 ? "bg-green-600 text-white" : ""
                    }
                  >
                    {stats.selectedCount}/{stats.totalCount}
                  </Badge>
                </CardTitle>

                {stats.totalCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleToggleAllForType(type)}
                    className="text-xs px-3 py-1 rounded-full border transition-colors hover:opacity-80"
                    style={
                      stats.allSelected
                        ? {
                            backgroundColor: COLORS.SUCCESS_BG,
                            color: COLORS.SUCCESS,
                            borderColor: COLORS.SUCCESS + "30",
                          }
                        : stats.partiallySelected
                          ? {
                              backgroundColor: COLORS.WARNING + "10",
                              color: COLORS.WARNING,
                              borderColor: COLORS.WARNING + "30",
                            }
                          : {
                              backgroundColor: COLORS.BG_GRAY,
                              color: COLORS.TEXT_SECONDARY,
                              borderColor: COLORS.BORDER,
                            }
                    }
                  >
                    {stats.allSelected
                      ? "Tout désélectionner"
                      : "Tout sélectionner"}
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => (
                  <ProductItem
                    key={product.name}
                    product={product}
                    isSelected={selectedProducts.includes(product.name)}
                    onToggle={() => handleProductToggle(product.name)}
                    showLabels={showLabels}
                  />
                ))}
              </div>

              {stats.selectedCount > 0 && (
                <div
                  className="mt-4 pt-4 border-t"
                  style={{ borderColor: COLORS.BORDER }}
                >
                  <p
                    className="text-xs"
                    style={{ color: COLORS.TEXT_SECONDARY }}
                  >
                    {stats.selectedCount} produit
                    {stats.selectedCount > 1 ? "s" : ""} sélectionné
                    {stats.selectedCount > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Résumé global */}
      {selectedProducts.length > 0 && (
        <GlobalSummary
          selectedCount={selectedProducts.length}
          maxSelection={maxSelection}
        />
      )}
    </div>
  );
};

export default ProductSelector;

/**
 * Export des types pour utilisation externe
 */
export type { ProductSelectorProps, Product, ProductStats };
