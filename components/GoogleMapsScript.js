"use client";

import Script from "next/script";

export default function GoogleMapsScript() {
  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?v=beta&key=${process.env.NEXT_PUBLIC_GOOGLE_PLACE_API_KEY}&libraries=marker`}
      strategy="beforeInteractive"
      onLoad={() => {
        console.log("Google Maps API script loaded");
      }}
    />
  );
}
