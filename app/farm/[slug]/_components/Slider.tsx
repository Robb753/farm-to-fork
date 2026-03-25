"use client";

import React, { useMemo, useState } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "@/utils/icons";
import OptimizedImage from "@/components/ui/OptimizedImage";

export type SliderImage = {
  url?: string | null;
  // tu peux étendre plus tard (id, alt, etc.)
};

interface SliderProps {
  imageList?: SliderImage[] | null;
}

export default function Slider({ imageList }: SliderProps): JSX.Element {
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const defaultImage = "/placeholder-farm.jpg";

  const safeImages = useMemo<SliderImage[]>(
    () => (Array.isArray(imageList) ? imageList.filter(Boolean) : []),
    [imageList]
  );

  const hasImages = safeImages.length > 0;

  const handlePrevious = (): void => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? (hasImages ? safeImages.length - 1 : 0) : prev - 1
    );
  };

  const handleNext = (): void => {
    setCurrentImageIndex((prev) =>
      hasImages ? (prev + 1) % safeImages.length : 0
    );
  };

  const handleImageClick = (index: number): void => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
  };

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

  // sécurise l’index si l’array change
  const clampedIndex =
    currentImageIndex < 0
      ? 0
      : currentImageIndex >= safeImages.length
        ? safeImages.length - 1
        : currentImageIndex;

  const currentImage = safeImages[clampedIndex];

  if (isModalOpen && currentImage) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl h-[80vh] max-h-[80vh]">
            <OptimizedImage
              src={currentImage.url || defaultImage}
              fill
              sizes="90vw"
              alt={`Agrandissement image ${clampedIndex + 1}`}
              objectFit="contain"
              className="bg-black"
              fallbackSrc={defaultImage}
              quality={85}
            />
          </div>

          <button
            type="button"
            className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
            onClick={() => setIsModalOpen(false)}
          >
            <X className="h-6 w-6" />
          </button>

          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
            onClick={handlePrevious}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white py-1 px-3 rounded-full text-sm">
            {clampedIndex + 1} / {safeImages.length}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <Carousel className="w-full">
        <CarouselContent>
          {safeImages.map((item, index) => (
            <CarouselItem key={index}>
              <div
                className="relative aspect-[4/3] h-auto max-h-[400px] rounded-lg overflow-hidden cursor-pointer"
                onClick={() => handleImageClick(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    handleImageClick(index);
                }}
              >
                <OptimizedImage
                  src={item.url || defaultImage}
                  fill
                  sizes="100vw"
                  alt={`image ${index + 1}`}
                  priority={index === 0}
                  objectFit="contain"
                  className="bg-white"
                  fallbackSrc={defaultImage}
                  quality={80}
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

      {safeImages.length > 1 && (
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2 justify-center">
          {safeImages.map((item, index) => (
            <div
              key={index}
              className={`relative h-16 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 cursor-pointer ${
                clampedIndex === index
                  ? "border-green-500"
                  : "border-transparent"
              }`}
              onClick={() => handleImageClick(index)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") handleImageClick(index);
              }}
            >
              <OptimizedImage
                src={item.url || defaultImage}
                fill
                sizes="64px"
                alt={`thumbnail ${index + 1}`}
                objectFit="contain"
                className="bg-white"
                fallbackSrc={defaultImage}
                quality={70}
                priority
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
