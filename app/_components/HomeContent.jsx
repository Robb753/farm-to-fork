  "use client";

  import React from "react";
  import { useCoordinates } from "../contexts/CoordinateContext";
  import { useRouter } from "next/navigation";
  import { Toaster } from "sonner";
import LargeCards from "./LargeCards";

  function HomeContent() {
    const { coordinates, setCoordinates } = useCoordinates();
    const router = useRouter();

    return (
      <div>
        <div className="relative h-[200px] sm:h-[300px] lg:h-[400px] xl:h-[500px] 2xl:h-[600px]">
          <Toaster richColors />
          <video
            src={"/2547258-uhd_3840_2160_30fps.mp4"}
            autoPlay
            loop
            playsInline
            muted
            className="absolute top-0 left-0 w-full h-full object-cover"
          />
          <div className="absolute top-1/3 w-full text-center px-4">
            <h1 className="text-white text-2xl sm:text-4xl font-bold mb-4 drop-shadow-md">
              Bienvenue sur Farm To Fork
            </h1>
            <p className="text-white text-lg sm:text-xl drop-shadow-md">
              Connectez-vous avec les producteurs locaux de manière simple et
              efficace.
            </p>
          </div>
        </div>
        <main className="max-w-7xl mx-auto px-8 sm:px-16">
          <section className="pt-6">
            <h2 className="text-4xl font-semibold pb-2">Explore Nearby</h2>
            <LargeCards
              img="/pexels-pixabay-235985.jpg"
              title="The Greatest Outdoors"
              description="Whishlist curated by Me"
              buttonText="Get Inspired"
            />
          </section>
        </main>
      </div>
    );
  }

  export default HomeContent;
