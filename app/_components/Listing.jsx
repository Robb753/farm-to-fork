import { BathIcon, BedDouble, MapPin, RulerIcon } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Link from "next/link";

function Listing({ listing, searchAddress, filters }) {
  const [address, setAddress] = useState(searchAddress);

  useEffect(() => {
    setAddress(searchAddress);
  }, [searchAddress]);

  const filteredListing = listing.filter((item) =>
    ["product_type", "certifications", "purchase_mode"].every(
      (filterKey) =>
        filters[filterKey].length === 0 ||
        filters[filterKey].some((filter) => item[filterKey].includes(filter))
    )
  );

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {address && (
        <div className="px-3 my-5">
          <h2 className="text-sm sm:text-xl font-semibold">
            Found <span className="font-bold">{filteredListing.length}</span>{" "}
            Results in{" "}
            <span className="text-primary font-bold">{address?.label}</span>
          </h2>
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        {filteredListing.length > 0
          ? filteredListing.map((item) => (
              <Link key={item.id} href={`/view-listing/${item.id}`}>
                <div className="p-3 hover:border hover:border-primary cursor-pointer rounded-lg transition-shadow duration-200 hover:shadow-lg">
                  <Image
                    src={item.listingImages[0]?.url || "/default-image.jpg"}
                    width={800}
                    height={150}
                    className="rounded-lg object-cover h-[170px] w-full"
                    alt={`Listing image ${item.id}`}
                    priority
                  />
                  <div className="flex mt-2 flex-col gap-2 overflow-hidden">
                    <h2 className="font-bold text-lg sm:text-xl truncate">
                      {item.name}
                    </h2>
                    <h2 className="flex gap-2 text-sm text-gray-400">
                      <MapPin className="h-4 w-4 text-gray-800" />
                      <span className="truncate">{item.address}</span>
                    </h2>
                    <div className="flex mt-2 gap-2 justify-between flex-wrap">
                      {[
                        {
                          icon: BedDouble,
                          text: item.product_type?.join(", "),
                        },
                        {
                          icon: BathIcon,
                          text: item.certification?.join(", "),
                        },
                        {
                          icon: RulerIcon,
                          text: item.purchase_mode?.join(", "),
                        },
                      ].map(({ icon: Icon, text }, index) => (
                        <h2
                          key={index}
                          className="flex gap-2 text-sm bg-slate-100 rounded-md p-2 text-gray-600 justify-center items-center"
                        >
                          <Icon className="h-4 w-4" />
                          {text || "N/A"}
                        </h2>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))
          : Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="h-[230px] w-full bg-slate-100 animate-pulse rounded-lg"
              ></div>
            ))}
      </div>
    </div>
  );
}

export default Listing;
