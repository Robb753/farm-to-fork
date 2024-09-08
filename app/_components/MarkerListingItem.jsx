import { MapPin, Map, ShieldCheck, Home } from "lucide-react";
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
    <div className="markercontent">
      <div className="vignette-content">
        <div className="w-full max-w-md overflow-hidden shadow-lg">
          {/* Image en haut, occupant toute la largeur */}
          <div className="relative h-36 w-full">
            <img
              src={item.listingImages[0]?.url || "/default-image.jpg"}
              alt={item.name || "N/A"}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Contenu en dessous de l'image */}
          <div className="bg-white p-1">
            <div className="flex items-center gap-2">
              <svg
                className="w-8 h-8 text-primary"
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="2" x2="5" y1="12" y2="12" />
                <line x1="19" x2="22" y1="12" y2="12" />
                <line x1="12" x2="12" y1="2" y2="5" />
                <line x1="12" x2="12" y1="19" y2="22" />
                <circle cx="12" cy="12" r="7" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {item.name || "N/A"}
                </h3>
                <p className="text-gray-500">{item?.address || "N/A"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MarkerListingItem;
