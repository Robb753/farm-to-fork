import React, { useEffect, useRef } from "react";
import ReactDOMServer from "react-dom/server";
import MarkerListingItem from "./MarkerListingItem";
import Link from "next/link";

function GoogleMarkerItem({ map, item, setSelectedListing, clearInfoWindows }) {
  const markerRef = useRef(null);
  const infoWindowRef = useRef(null);

  useEffect(() => {
    if (!map || !item?.coordinates) return;

    const initializeMarker = async () => {
      if (markerRef.current) markerRef.current.setMap(null);
      if (infoWindowRef.current) infoWindowRef.current.close();

      try {
        const { AdvancedMarkerElement } =
          await window.google.maps.importLibrary("marker");

        markerRef.current = new AdvancedMarkerElement({
          position: item.coordinates,
          map,
          title: item.name,
        });

        const contentString = ReactDOMServer.renderToString(
          <Link href={`/view-listing/${item.id}`}>
            <MarkerListingItem item={item} />
          </Link>
        );

        infoWindowRef.current = new window.google.maps.InfoWindow({
          content: contentString,
          maxWidth: 200,
        });

        markerRef.current.addListener("click", () => {
          clearInfoWindows(); // Fermer tous les autres InfoWindows
          infoWindowRef.current.open({ anchor: markerRef.current, map });
        });

        markerRef.current.addListener("mouseover", () => {
          setSelectedListing(item);
        });

        markerRef.current.addListener("mouseout", () => {
          setSelectedListing(null);
        });
      } catch (error) {
        console.error("Error initializing marker:", error);
      }
    };

    initializeMarker();

    return () => {
      if (markerRef.current) markerRef.current.setMap(null);
    };
  }, [map, item, setSelectedListing, clearInfoWindows]);

  return null;
}

export default GoogleMarkerItem;
