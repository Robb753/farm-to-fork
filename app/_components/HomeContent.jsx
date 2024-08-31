"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import GoogleAddressSearch from "./GoogleAddressSearch";
import { useCoordinates } from "../contexts/CoordinateContext";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

function HomeContent() {
  const { coordinates, setCoordinates } = useCoordinates();
  const router = useRouter();

  const handleViewMapClick = () => {
    if (coordinates?.lat && coordinates?.lng) {
      const query = new URLSearchParams({
        lat: coordinates.lat.toString(),
        lng: coordinates.lng.toString(),
      }).toString();
      router.push(`/productor?${query}`);
    } else {
      toast.error("Veuillez sélectionner une adresse valide");
        <Toaster richColors />;
    }
  };


  return (
    <div className="relative min-h-screen">
      <Toaster richColors />
      <video
        className="h-screen w-full absolute top-0 left-0 object-cover -z-10"
        src={"/2547258-uhd_3840_2160_30fps.mp4"}
        autoPlay
        loop
        playsInline
        muted
      ></video>

      <div className="">
        <header className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full text-white text-center">
          <h1 className="font-medium text-2xl uppercase leading-none">
            Bienvenue sur Farm To Fork
            <br />
            <span className="block font-bold text-6xl">Exploring</span>
          </h1>

          <p className="mt-16 p-6 text-base">
            Connectez-vous avec les producteurs locaux de
            <br /> manière simple et efficace.
          </p>
        </header>

        <div className="absolute bottom-32 w-1/2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-60 text-black text-opacity-90 rounded-lg p-6 text-center">
          <GoogleAddressSearch
            selectedAddress={(v) => {
              setCoordinates({
                lat: v?.value?.geometry?.location?.lat() || 0,
                lng: v?.value?.geometry?.location?.lng() || 0,
              });
            }}
            setCoordinates={setCoordinates}
          />
          <Button
            className="px-4 py-2 mt-4 w-full sm:w-auto text-sm sm:text-base lg:text-lg"
            onClick={handleViewMapClick}
          >
            <p className="text-pretty">Voir la carte des producteurs</p>
          </Button>
          <p
            className="text-xs mt-0.5 text-white text-opacity-90"
            style={{
              fontSize: "0.60rem",
              marginTop: "0.8rem",
            }}
          >
            Video Credit: Tom Fisk{" "}
            <Link href="https://www.pexels.com/fr-fr/video/vue-aerienne-d-un-paysage-brumeux-2547258/">
              pexels.com
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default HomeContent;
