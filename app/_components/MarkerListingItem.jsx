import { MapPin, Map } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

function MarkerListingItem({ item }) {
  const [showMap, setShowMap] = useState(false);

  if (!item) {
    return <div>Loading...</div>;
  }

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  return (
    <div>
      <div className="cursor-pointer rounded-lg w-[180px]">
        <Image
          src={item.listingImages[0]?.url || "/default-image.jpg"}
          width={800}
          height={150}
          className="rounded-lg object-cover h-[120px] w-[160px]"
          alt={`Listing image`}
          priority
        />

        <div className="flex mt-2 py-2 flex-col">
          <h2 className="font-bold text-xl">{item?.name || "N/A"}</h2>
          <h2 className="flex gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4 text-gray-800" />
            {item?.address || "N/A"}
          </h2>
          <button
            onClick={toggleMap}
            className="mt-2 flex items-center text-primary hover:underline"
          >
            <Map className="h-4 w-4 mr-1" />
            {showMap ? "Hide Map" : "Show Map"}
          </button>
        </div>
      </div>

      {showMap && (
        <div className="mt-2 w-full h-[150px] rounded-lg overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY}&center=${item.coordinates.lat},${item.coordinates.lng}&zoom=15&maptype=roadmap`}
            title={`Map for ${item.name}`}
          ></iframe>
        </div>
      )}
    </div>
  );
}

export default MarkerListingItem;
