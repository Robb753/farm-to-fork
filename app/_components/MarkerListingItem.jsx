import { MapPin, X } from "lucide-react";
import Image from "next/image";
import React from "react";

function MarkerListingItem({ item,closeHandler }) {
  // Assurez-vous que `item` est défini avant d'accéder à ses propriétés
  if (!item) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="cursor-pointer rounded-lg w-[180px]">
        <X onClick={() => closeHandler()} />
        <Image
          src={item.listingImages[0].url}
          width={800}
          height={150}
          className="rounded-lg object-cover h-[120px] w-[160px]"
          alt={`Listing image`}
          priority
        />

        <div className="flex mt-2 py-2 flex-col bg-white">
          <h2 className="font-bold text-xl">{item?.website || "N/A"}</h2>
          <h2 className="flex gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4 text-gray-800" />
            {item?.address || "N/A"}
          </h2>
        </div>
      </div>
    </div>
  );
}

export default MarkerListingItem;
