// modules/listings/components/MarkerListingItem.jsx
import React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Star } from "lucide-react";

function MarkerListingItem({ item }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/view-listing/${item.id}`);
  };

  return (
    <div
      className="p-2 max-w-[250px] cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleClick}
    >
      <div className="flex flex-col">
        <h3 className="font-semibold text-gray-800 text-sm mb-1 truncate">
          {item?.name || "Sans nom"}
        </h3>

        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <MapPin className="h-3 w-3 text-primary" />
          <span className="truncate">
            {item?.address || "Adresse non disponible"}
          </span>
        </div>

        {item?.description && (
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {item.description}
          </p>
        )}

        {item?.rating && (
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-medium">
              {item.rating.toFixed(1)}
            </span>
          </div>
        )}

        <button
          className="mt-2 text-xs bg-primary text-white py-1 px-2 rounded"
          onClick={handleClick}
        >
          Voir détails
        </button>
      </div>
    </div>
  );
}

export default MarkerListingItem;
