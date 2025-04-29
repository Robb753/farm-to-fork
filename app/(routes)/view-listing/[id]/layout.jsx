// app/(routes)/view-listing/[id]/layout.jsx
import { MapDataProvider } from "@/app/contexts/MapDataContext/MapDataProvider";

export default function ViewListingLayout({ children }) {
  return <MapDataProvider>{children}</MapDataProvider>;
}
