import React, { useEffect, useRef } from "react";
import { useGoogleMaps } from "../contexts/GoogleMapsContext";
import { useCoordinates } from "../contexts/CoordinateContext";

function GoogleAddressSearchForListingMapView({
  selectedAddress,
  setParentCoordinates,
  onAddressChange,
}) {
  const { isApiLoaded } = useGoogleMaps();
  const inputRef = useRef(null);
  const { coordinates, setCoordinates } = useCoordinates();

  useEffect(() => {
    if (isApiLoaded && inputRef.current) {
      const autocompleteInstance = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: ["(cities)"],
          componentRestrictions: { country: "fr" },
        }
      );

      const handlePlaceChanged = () => {
        const place = autocompleteInstance.getPlace();
        if (!place || !place.geometry) {
          selectedAddress(null);
          setCoordinates({ lat: 48.8575, lng: 2.23453 });
          if (onAddressChange) onAddressChange(null);
          return;
        }

        selectedAddress(place);
        const latLng = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        setCoordinates(latLng);
        setParentCoordinates(latLng);
        if (onAddressChange) onAddressChange(place);
      };

      autocompleteInstance.addListener("place_changed", handlePlaceChanged);
    }
  }, [isApiLoaded, selectedAddress, setCoordinates, onAddressChange]);

  return (
    <div className="flex items-center md:border-2 rounded-full py-2 md:shadow-sm px-2 sm:px-4">
      <input
        type="text"
        ref={inputRef}
        placeholder="Start Your Search"
        className="flex-grow pl-2 sm:pl-5 bg-transparent outline-none text-sm sm:text-base"
      />
    </div>
  );
}

export default GoogleAddressSearchForListingMapView;
