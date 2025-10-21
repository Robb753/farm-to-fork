"use client";

import SingleFarmMapbox from "@/app/modules/maps/components/SingleFarmMapbox";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function MapCard({ listing }) {
  const { lat, lng, name } = listing || {};

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
          <SingleFarmMapbox lat={lat} lng={lng} name={name} />
        </div>
      </CardContent>
    </Card>
  );
}
