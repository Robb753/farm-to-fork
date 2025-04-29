"use client";

import React, { useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";

function Slider({ imageList }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Image par défaut si aucune image n'est disponible
  const defaultImage = "/placeholder-farm.jpg"; // Assurez-vous d'avoir cette image dans votre dossier public
  const hasImages = imageList && imageList.length > 0;

  // Gérer les clics précédent/suivant
  const handlePrevious = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (hasImages ? imageList.length - 1 : 0) : prev - 1
    );
  };

  const handleNext = () => {
    setCurrentImageIndex((prev) =>
      hasImages ? (prev + 1) % imageList.length : 0
    );
  };

  // Ouvrir la vue agrandie
  const handleImageClick = (index) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

  // Si pas d'images, afficher un placeholder
  if (!hasImages) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg flex items-center justify-center">
        <div className="text-gray-400 flex flex-col items-center">
          <ZoomIn className="w-12 h-12 mb-2" />
          <p>Aucune image disponible</p>
        </div>
      </div>
    );
  }

  // Vue modale (version simplifiée sans Dialog component)
  if (isModalOpen) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          {/* Image principale */}
          <div className="relative w-full max-w-4xl h-[80vh] max-h-[80vh]">
            <Image
              src={imageList[currentImageIndex].url || defaultImage}
              fill
              alt={`Agrandissement image ${currentImageIndex + 1}`}
              className="object-contain"
              onError={(e) => {
                e.target.src = defaultImage;
              }}
            />
          </div>

          {/* Bouton fermer */}
          <button
            className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            onClick={() => setIsModalOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          {/* Bouton précédent */}
          <button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Bouton suivant */}
          <button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Compteur d'images */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 text-white py-1 px-3 rounded-full text-sm">
            {currentImageIndex + 1} / {imageList.length}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      {/* Carousel principal */}
      <Carousel className="w-full">
        <CarouselContent>
          {imageList.map((item, index) => (
            <CarouselItem key={index}>
              <div
                className="relative aspect-[16/9] h-[300px] md:h-[400px] rounded-lg overflow-hidden cursor-pointer"
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={item.url || defaultImage}
                  fill
                  alt={`image ${index + 1}`}
                  priority={index === 0}
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = defaultImage;
                  }}
                />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <ZoomIn className="text-white w-10 h-10 bg-black/50 p-2 rounded-full" />
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity" />
        <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </Carousel>

      {/* Vignettes en bas si plus d'une image */}
      {imageList.length > 1 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2 justify-center">
          {imageList.map((item, index) => (
            <div
              key={index}
              className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 cursor-pointer 
                ${
                  currentImageIndex === index
                    ? "border-green-500"
                    : "border-transparent"
                }`}
              onClick={() => handleImageClick(index)}
            >
              <Image
                src={item.url || defaultImage}
                fill
                alt={`thumbnail ${index + 1}`}
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Slider;
