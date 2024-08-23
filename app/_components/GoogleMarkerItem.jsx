import React, { useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import MarkerListingItem from "./MarkerListingItem";
import Link from "next/link";

function GoogleMarkerItem({ map, item, setSelectedListing, selectedListing }) {
  const markerRef = useRef(null);
  const InfoWindow = useRef(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    async function createAdvancedMarker() {
      if (!map || !item || !item.coordinates) {
        console.warn("Map, item, or item.coordinates is missing");
        return;
      }

      // Clear previous marker and InfoWindow
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      if (InfoWindow.current) {
        InfoWindow.current.close();
      }

      const { AdvancedMarkerElement } = await window.google.maps.importLibrary(
        "marker"
      );

      markerRef.current = new AdvancedMarkerElement({
        position: item.coordinates,
        map,
        title: item.name,
      });

      // Generate HTML string for InfoWindow
      const contentString = ReactDOMServer.renderToString(
        <div>
          <Link href={"/view-listing/" + item.id}>
            <MarkerListingItem item={item} />
          </Link>
        </div>
      );

      InfoWindow.current = new window.google.maps.InfoWindow({
        content: contentString,
        maxWidth: 200,
      });

      // Event listeners
      markerRef.current.addListener("click", () => {
        console.log(item);
        InfoWindow.current.open({
          anchor: markerRef.current,
          map,
          shouldFocus: false,
        });
      });

      markerRef.current.addListener("mouseover", () => {
        setHovered(true);
        setSelectedListing(item);
      });

      markerRef.current.addListener("mouseout", () => {
        setHovered(false);
      });
    }

    createAdvancedMarker();

    return () => {
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [map, item, setSelectedListing]);

  return hovered && selectedListing ? (
    <MarkerListingItem 
    closeHandler={()=>setSelectedListing(null)}
    item={item} index={index} />
  ) : null;
}

export default GoogleMarkerItem;
