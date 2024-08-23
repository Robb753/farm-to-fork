import { BathIcon, BedDouble, MapPin, RulerIcon, } from "lucide-react";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import FilterSection from "./FilterSection";
import Link from "next/link";

function Listing({
  listing,
  handleSearchClick,
  searchAddress,
  setCoordinates,
}) {
  const [address, setAddress] = useState(searchAddress);

  useEffect(() => {
    // Mettre à jour l'adresse locale si searchAddress change
    if (searchAddress) {
      setAddress(searchAddress);
    }
  }, [searchAddress]);

  return (
    <div>
      <div className="p-3 flex gap-6">
        {/* Le bouton de recherche est commenté, vous pouvez le réactiver si nécessaire */}
        {/* <Button className="flex gap-2" onClick={handleSearchClick}>
          <Search className="h-4 w-4" />
          Search
        </Button> */}
      </div>
      <FilterSection />
      {address && (
        <div className="px-3 my-5">
          <h2 className="font-xl">
            Found <span className="font-bold">{listing?.length}</span> Result in{" "}
            <span className="text-primary font-bold">{address?.label}</span>
          </h2>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {listing && listing.length > 0
          ? listing.map((item) => (
              <Link key={item.id} href={"/view-listing/" + item.id}>
                <div className="p-3 hover:border hover:border-primary cursor-pointer rounded-lg">
                  <Image
                    src={item.listingImages[0].url}
                    width={800}
                    height={150}
                    className="rounded-lg object-cover h-[170px]"
                    alt={`Listing image ${item.id}`}
                    priority
                  />

                  <div className="flex mt-2 flex-col gap-2 overflow-hidden">
                    <h2 className="font-bold text-xl">{item?.name}</h2>
                    <h2 className="flex gap-2 text-sm text-gray-400">
                      <MapPin className="h-4 w-4 text-gray-800" />
                      {item?.address}
                    </h2>
                    <div className="flex mt-2 gap-2 justify-between">
                      <h2 className="flex gap-2 text-sm bg-slate-100 rounded-md p-2 text-gray-600 justify-center items-center">
                        <BedDouble className="h-4 w-4" />
                        {item?.product_type}
                      </h2>
                      <h2 className="flex gap-2 text-sm bg-slate-100 rounded-md p-2 text-gray-600 justify-center items-center">
                        <BathIcon className="h-4 w-4" />
                        {item?.certification}
                      </h2>
                      <h2 className="flex gap-2 text-sm bg-slate-100 rounded-md p-2 text-gray-600 justify-center items-center">
                        <RulerIcon className="h-4 w-4" />
                        {item?.purchase_mode}
                      </h2>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          : [1, 2, 3, 4, 5, 6, 7, 8].map((_, index) => (
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
