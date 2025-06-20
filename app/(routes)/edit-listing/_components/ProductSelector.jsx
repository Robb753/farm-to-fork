// components/edit-listing/ProductSelector.jsx

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import vegetables from "@/app/_data/vegetables.json";
import fruits from "@/app/_data/fruits.json";
import dairyProducts from "@/app/_data/dairy-products.json";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const productDataByType = {
  Légumes: vegetables,
  Fruits: fruits,
  "Produits laitiers": dairyProducts,
};

export default function ProductSelector({
  selectedTypes = [],
  selectedProducts = [],
  onChange,
}) {
  const toggleProduct = (productName) => {
    onChange(
      selectedProducts.includes(productName)
        ? selectedProducts.filter((p) => p !== productName)
        : [...selectedProducts, productName]
    );
  };

  if (selectedTypes.length === 0) return null;

  return (
    <div className="lg:col-span-3 flex flex-col gap-6">
      {selectedTypes.map((type) => {
        const products = productDataByType[type] || [];

        return (
          <Card key={type} className="shadow-sm border">
            <CardHeader>
              <CardTitle className="text-green-700">
                {`Quels ${type.toLowerCase()} proposez-vous ?`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {products.map((product) => (
                  <Label
                    key={product.name}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedProducts.includes(product.name)}
                      onCheckedChange={() => toggleProduct(product.name)}
                    />
                    <span className="text-sm font-medium">
                      {product.name}
                      {product.labels?.map((label) => (
                        <Badge key={label} className="ml-2 text-xs">
                          {label}
                        </Badge>
                      ))}
                    </span>
                  </Label>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
