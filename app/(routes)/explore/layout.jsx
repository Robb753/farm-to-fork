import { MapDataProvider } from "@/app/contexts/MapDataContext/MapDataProvider";

export default function ExploreLayout({ children }) {
  return <MapDataProvider>{children}</MapDataProvider>;
}
