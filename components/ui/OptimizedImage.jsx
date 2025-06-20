"use client";

import Image from "next/image";
import { useState } from "react";

const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  fill,
  sizes,
  priority = false,
  className = "",
  fallbackSrc = "/placeholder.png",
  objectFit = "cover",
  quality = 75,
  placeholder = "blur",
  blurDataURL,
  onError,
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const defaultBlurDataURL =
    "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==";

  const handleLoad = () => setIsLoading(false);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
    setImgSrc(fallbackSrc);
    onError?.();
  };

  const imageProps = {
    src: imgSrc,
    alt,
    quality,
    className: `${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`,
    onLoad: handleLoad,
    onError: handleError,
    placeholder: blurDataURL || placeholder === "blur" ? "blur" : "empty",
    blurDataURL: blurDataURL || defaultBlurDataURL,
    sizes: fill ? (sizes ?? "100vw") : sizes,
    ...props,
  };

  if (fill) {
    return (
      <div className="relative overflow-hidden">
        <Image {...imageProps} fill style={{ objectFit }} />
        {isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-sm">Image non disponible</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <Image
        {...imageProps}
        width={width}
        height={height}
        style={{ objectFit }}
        priority={priority}
      />
      {isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={{ width, height }}
        >
          <span className="text-gray-400 text-xs">Erreur</span>
        </div>
      )}
    </div>
  );
};

// ✅ Composants spécialisés

export const AvatarImage = ({
  src,
  alt,
  size = 40,
  className = "",
  ...props
}) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={size}
    height={size}
    className={`rounded-full ${className}`}
    sizes="(max-width: 768px) 40px, 60px"
    quality={90}
    {...props}
  />
);

export const ListingImage = ({ src, alt, className = "", ...props }) => (
  <OptimizedImage
    src={src}
    alt={alt}
    fill
    className={`object-cover ${className}`}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    quality={80}
    {...props}
  />
);

export const HeroImage = ({
  src,
  alt,
  className = "",
  priority = true,
  ...props
}) => (
  <OptimizedImage
    src={src}
    alt={alt}
    fill
    className={`object-cover ${className}`}
    sizes="100vw"
    quality={85}
    priority={priority}
    {...props}
  />
);

export const ThumbnailImage = ({
  src,
  alt,
  width = 100,
  height = 100,
  className = "",
  ...props
}) => (
  <OptimizedImage
    src={src}
    alt={alt}
    width={width}
    height={height}
    className={`object-cover rounded ${className}`}
    sizes="(max-width: 768px) 80px, 100px"
    quality={75}
    {...props}
  />
);

export default OptimizedImage;
