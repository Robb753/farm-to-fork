// ProductSelector.tsx - VERSION ULTRA-SIMPLIFIÉE

"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import vegetables from "@/app/_data/vegetables.json";
import fruits from "@/app/_data/fruits.json";
import dairyProducts from "@/app/_data/dairy-products.json";

interface Product {
  name: string;
  category: string;
  type: string;
  labels: string[];
}

interface ProductSelectorProps {
  selectedTypes: string[];
  selectedProducts: string[];
  onChange: (products: string[]) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedTypes,
  selectedProducts,
  onChange,
}) => {
  // 📊 Données des produits
  const productData: { [key: string]: Product[] } = {
    Légumes: vegetables as Product[],
    Fruits: fruits as Product[],
    "Produits laitiers": dairyProducts as Product[],
  };

  // 🔘 Fonction simple pour toggle un produit
  const handleProductToggle = (productName: string) => {
    const isSelected = selectedProducts.includes(productName);
    const newProducts = isSelected
      ? selectedProducts.filter((p) => p !== productName)
      : [...selectedProducts, productName];

    // ✅ Appel direct, pas de logique compliquée
    onChange(newProducts);
  };

  // 🔘 Fonction pour sélectionner/désélectionner tous les produits d'un type
  const handleToggleAllForType = (type: string) => {
    const products = productData[type] || [];
    const productNames = products.map((p) => p.name);
    const allSelected = productNames.every((name) =>
      selectedProducts.includes(name)
    );

    let newProducts: string[];
    if (allSelected) {
      // Désélectionner tous les produits de ce type
      newProducts = selectedProducts.filter((p) => !productNames.includes(p));
    } else {
      // Sélectionner tous les produits de ce type
      const combinedProducts = [...selectedProducts, ...productNames];
      newProducts = Array.from(new Set(combinedProducts));
    }

    onChange(newProducts);
  };

  // 📝 Si aucun type sélectionné, ne rien afficher
  if (selectedTypes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🥕</div>
          <p>Sélectionnez d'abord les types de produits ci-dessus</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {selectedTypes.map((type) => {
        const products = productData[type] || [];

        if (products.length === 0) {
          return (
            <Card key={type} className="border-gray-200">
              <CardContent className="p-4 text-center text-gray-500">
                Aucun produit disponible pour {type}
              </CardContent>
            </Card>
          );
        }

        const selectedCount = products.filter((p) =>
          selectedProducts.includes(p.name)
        ).length;
        const totalCount = products.length;
        const allSelected = selectedCount === totalCount;

        return (
          <Card
            key={type}
            className="border-gray-200 hover:shadow-md transition-shadow"
          >
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-700 flex items-center gap-2">
                  Quels {type.toLowerCase()} proposez-vous ?
                  <Badge variant={selectedCount > 0 ? "default" : "secondary"}>
                    {selectedCount}/{totalCount}
                  </Badge>
                </CardTitle>

                {totalCount > 0 && (
                  <button
                    type="button"
                    onClick={() => handleToggleAllForType(type)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      allSelected
                        ? "bg-green-100 text-green-700 border-green-200"
                        : selectedCount > 0
                          ? "bg-orange-100 text-orange-700 border-orange-200"
                          : "bg-gray-100 text-gray-700 border-gray-200"
                    } hover:opacity-80`}
                  >
                    {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                  </button>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product.name);

                  return (
                    <div
                      key={product.name}
                      onClick={() => handleProductToggle(product.name)}
                      className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm ${
                        isSelected
                          ? "border-green-300 bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`product-${product.name}`}
                          name={`specific-product-${product.name.replace(/\s+/g, "-").toLowerCase()}`}
                          checked={isSelected}
                          onChange={() => {}}
                          className="mt-0.5 h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 pointer-events-none"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium block">
                            {product.name}
                          </span>

                          {product.labels && product.labels.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product.labels.map((label) => (
                                <Badge
                                  key={label}
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700"
                                >
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {product.category && product.category !== type && (
                            <span className="text-xs text-gray-500 block mt-1">
                              {product.category}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-600">
                    {selectedCount} produit{selectedCount > 1 ? "s" : ""}{" "}
                    sélectionné{selectedCount > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Résumé global */}
      {selectedProducts.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">
                  Total sélectionné
                </p>
                <p className="text-lg font-bold text-green-700">
                  {selectedProducts.length} produit
                  {selectedProducts.length > 1 ? "s" : ""}
                </p>
              </div>
              <div className="text-2xl">✅</div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductSelector;
