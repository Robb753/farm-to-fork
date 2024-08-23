import React from "react";
import GooglePlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "@jedrazb/react-google-places-autocomplete";
import { MapPin } from "lucide-react";

function GoogleAddressSearch({
  selectedAddress,
  setCoordinates,
  onAddressChange,
}) {
  const handleAddressChange = (place) => {
    if (!place) {
      selectedAddress(null);
      return;
    }

    selectedAddress(place);

    geocodeByAddress(place.label)
      .then((results) => getLatLng(results[0]))
      .then(({ lat, lng }) => {
        setCoordinates({ lat, lng });
        // Appel de la fonction onAddressChange pour mettre à jour la liste en temps réel
        onAddressChange(place);
      })
      .catch((error) => console.error("Error fetching lat/lng", error));
  };

  return (
    <div className="flex items-center w-full">
      <MapPin className="h-10 w-10 p-2 rounded-l-lg bg-primary" />
      <GooglePlacesAutocomplete
        apiKey={process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY}
        selectProps={{
          placeholder: "Search By Cities",
          isClearable: true,
          className: "w-full",
          onChange: handleAddressChange,
        }}
      />
    </div>
  );
}

export default GoogleAddressSearch;
