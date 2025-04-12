// app/contexts/MapDataContext/useMapData.js

import { useMapState } from "./MapStateContext";
import { useFilterState } from "./FilterStateContext";
import { useListingState } from "./ListingStateContext";

export function useMapData() {
  return {
    ...useMapState(),
    ...useFilterState(),
    ...useListingState(),
  };
}
