import {
  BathIcon,
  BedDouble,
  HeartIcon,
  MapPin,
  RulerIcon,
} from "lucide-react";
import Image from "next/image";
import React from "react";
import Link from "next/link";
import { useMapListing } from "../contexts/MapListingContext";

function Listing({ searchAddress }) {
  const mapListingContext = useMapListing();
  const { visibleListings } = mapListingContext || { visibleListings: [] };

  return (
    <div className="p-4 md:p-6 min-h-screen">
      {searchAddress && (
        <div className="mb-4 md:mb-6">
          <h2 className="text-sm md:text-xl font-semibold text-gray-700">
            Found{" "}
            <span className="font-bold text-primary">
              {visibleListings?.length || 0}
            </span>{" "}
            Results in{" "}
            <span className="text-primary font-bold">
              {searchAddress?.label}
            </span>
          </h2>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {visibleListings?.length > 0
          ? visibleListings.map((item) => (
              <Link key={item.id} href={`/view-listing/${item.id}`}>
                <div className="flex flex-col sm:flex-row items-start p-4 bg-white border-b py-7 px-2 pr-4 hover:opacity-80 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer gap-4">
                  {/* Image Section */}
                  <div className="relative h-40 w-full sm:h-52 sm:w-52 md:w-64 lg:w-80 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={
                        item?.listingImages?.[0]?.url || "/default-image.jpg"
                      }
                      width={150}
                      height={100}
                      className="object-cover w-full h-full"
                      alt={`Listing image ${item.id}`}
                      priority
                    />
                  </div>

                  {/* Text Section */}
                  <div className="flex flex-col flex-grow justify-between min-w-0">
                    {/* Title and Heart Icon */}
                    <div className="flex justify-between items-center">
                      <p className="font-normal text-base md:text-lg text-gray-600 truncate">
                        {item.name || "No name provided"}
                      </p>
                      <HeartIcon className="h-6 w-6 text-gray-400 cursor-pointer transition-transform transform hover:scale-110" />
                    </div>
                    <div className="border-b w-20 pt-2" />

                    {/* Address Section */}
                    <h2 className="flex items-center gap-2 text-sm text-gray-500 mt-2 truncate">
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="truncate">
                        {item?.address || "No address available"}
                      </span>
                    </h2>

                    {/* Additional Information */}
                    <div className="flex flex-wrap mt-3 gap-2">
                      {[
                        {
                          icon: BedDouble,
                          text: item?.product_type?.join(", ") || "N/A",
                        },
                        {
                          icon: BathIcon,
                          text: item?.certifications?.join(", ") || "N/A",
                        },
                        {
                          icon: RulerIcon,
                          text: item?.purchase_mode?.join(", ") || "N/A",
                        },
                      ].map(({ icon: Icon, text }, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 text-xs md:text-sm bg-gray-100 rounded-full px-3 py-1 text-gray-700"
                        >
                          <Icon className="h-4 w-4 text-primary" />
                          <span>{text}</span>
                        </div>
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
