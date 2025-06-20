// app/(routes)/add-new-listing/layout.jsx
import { MapDataProvider } from "@/app/contexts/MapDataContext/MapDataProvider";

export default function AddNewListingLayout({ children }) {
  return <MapDataProvider>{children}</MapDataProvider>;
}
