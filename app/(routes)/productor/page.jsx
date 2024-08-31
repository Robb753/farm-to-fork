import ListingMapView from '@/app/_components/ListingMapView';
import React from 'react'

function distributor() {
  return (
    <div className="p-1 sm:p-2 md:p-4 lg:p-10">
      <ListingMapView typeferme="Productor" />
    </div>
  );
}

export default distributor