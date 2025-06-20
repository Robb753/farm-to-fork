"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductsTab({ listing }) {
  const products = listing?.products || [];

  if (!products.length) {
    return (
      <div className="p-4 bg-white rounded-md border text-gray-500 text-sm">
        Aucun produit enregistré pour cette ferme.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((category, index) => (
        <Card key={index} className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-green-700 text-md font-semibold">
              {category.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {category.items.map((item, idx) => (
              <Badge
                key={idx}
                className="bg-green-100 text-green-800 border border-green-200"
              >
                {item}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
