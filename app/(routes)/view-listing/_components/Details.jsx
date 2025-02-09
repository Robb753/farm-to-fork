import { Button } from '@/components/ui/button'
import { Bath, BedDouble, CarFront, Drill, Home, LandPlot, MapPin, Share } from 'lucide-react'
import React from 'react'
import AgentDetail from './AgentDetail';
import GoogleMapSection from '@/app/_components/GoogleMapSection';

function Details({listingDetail}) {
  return (
    listingDetail && (
      <div>
        <div className="my-4 flex gap-2 flex-col">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-3xl">{listingDetail?.name}</h2>
              <h2 className="text-gray-500 text-lg flex gap-2 mt-4">
                <MapPin />
                {listingDetail?.address}
              </h2>
            </div>
          </div>
          <hr></hr>
          <h2 className="font-bold text-2xl">Key Features</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <h2 className="flex gap-2 item-center bg-primary rounded-lg p-3 text-white justify-center">
              <Home />
              {listingDetail?.typeferme}
            </h2>
            <h2 className="flex gap-2 items-center bg-primary rounded-lg p-3 text-white justify-center">
              <Drill />
              Products {listingDetail?.products}
            </h2>
            <h2 className="flex gap-2 items-center bg-primary rounded-lg p-3 text-white justify-center">
              <LandPlot />
              {listingDetail?.area}
            </h2>
            <h2 className="flex gap-2 items-center bg-primary rounded-lg p-3 text-white justify-center">
              <BedDouble />
              {listingDetail?.area} Bed
            </h2>
            <h2 className="flex gap-2 items-center bg-primary rounded-lg p-3 text-white justify-center">
              <Bath />
              {listingDetail?.area} Bath
            </h2>
            <h2 className="flex gap-2 items-center bg-primary rounded-lg p-3 text-white justify-center">
              <CarFront />
              {listingDetail?.area} Parking
            </h2>
          </div>
        </div>

        <div className="mt-4">
          <h2 className="font-bold text-2xl">What's Special</h2>
          <p className="text-gray-600">{listingDetail?.description}</p>
        </div>

        <div>
          <h2 className="font-bold text-2xl">Find on Map</h2>
          {listingDetail.coordinates ? (

            console.log("Coordinates passed to GoogleMapSection:", listingDetail.coordinates),
            <GoogleMapSection
              coordinates={listingDetail.coordinates}
              listing={[listingDetail]}
            />
          ) : (
            <p className="text-gray-500">
              No coordinates available for this listing.
            </p>
          )}
          
        </div>

        <div>
          <h2 className="font-bold text-lg"> Contact </h2>
          <AgentDetail listingDetail={listingDetail} />
        </div>
      </div>
    )
  );
}

export default Details