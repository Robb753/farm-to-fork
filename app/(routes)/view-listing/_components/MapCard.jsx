"use client";

import SingleFarmMap from "@/app/modules/maps/components/SingleFarmMap";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MapCard({ listing }) {
  const { lat, lng } = listing || {};

  if (!lat || !lng) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Localisation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
          <SingleFarmMap lat={lat} lng={lng} />
        </div>
      </CardContent>
    </Card>
  );
}
