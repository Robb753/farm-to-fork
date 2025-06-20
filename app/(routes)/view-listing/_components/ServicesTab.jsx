"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ServicesTab({ listing }) {
  const services = listing?.services || [];

  if (!services.length) {
    return (
      <div className="p-4 bg-white rounded-md border text-gray-500 text-sm">
        Aucun service n'a encore été renseigné.
      </div>
    );
  }

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <CardTitle className="text-green-700 text-md font-semibold">
          Services proposés par cette ferme
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {services.map((service, idx) => (
          <Badge
            key={idx}
            className="bg-blue-100 text-blue-800 border border-blue-200"
          >
            {service}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
