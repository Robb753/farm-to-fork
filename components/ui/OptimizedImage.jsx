"use client";

import Image from "next/image";
import { useState, useMemo } from "react";

/**
 * 🖼️ OptimizedImage – Wrapper Next.js amélioré
 */
const OptimizedImage = ({
  src,
  alt = "image",
  // Dimensionnement
  fill, // si true => wrapper relatif + <Image fill />
  width,
  height,
  sizes,
  // Rendu & perf
  priority = false,
  quality = 75,
  objectFit = "cover",
  // UX état
  className = "",
  showSkeleton = true,
  // placeholder/blur
  placeholder = "blur",
  blurDataURL,
  // fallback
  fallbackSrc = "/placeholder.png",
  // callbacks
  onError,
  onLoad,
  // wrapper custom
  wrapperClassName = "",
  ...props
}) => {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Blur par défaut si aucun blurDataURL fourni
  const defaultBlurDataURL = useMemo(
    () =>
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==",
    []
  );

  const handleLoad = (e) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
    setIsLoading(false);
    onError?.();
  };

  const resolvedPlaceholder =
    blurDataURL || placeholder === "blur" ? "blur" : "empty";

  const baseClass =
    `${className} ` +
    `${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`;

  // Props sûrs pour Next/Image
  const imgProps = {
    src: imgSrc || fallbackSrc,
    alt,
    quality,
    onLoad: handleLoad,
    onError: handleError,
    placeholder: resolvedPlaceholder,
    blurDataURL: blurDataURL || defaultBlurDataURL,
    sizes: fill ? (sizes ?? "100vw") : sizes,
    className: baseClass,
    priority,
    loading: priority ? undefined : "lazy",
    style: { objectFit },
    ...props,
  };

  if (!src && !fallbackSrc) {
    console.warn("⚠️ OptimizedImage: aucun src ou fallbackSrc défini !");
  }

  // Mode fill
  if (fill) {
    // retirer width/height si présents
    const { width, height, ...safeProps } = imgProps;

    return (
      // ✅ donne une taille explicite au parent pour éviter le warning
      <div
        className={`relative w-full h-full overflow-hidden ${wrapperClassName}`}
      >
        <Image {...safeProps} fill />
        {showSkeleton && isLoading && (
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

  // Mode width/height
  return (
    <div
      className={`relative inline-block ${wrapperClassName}`}
      style={width && height ? { width, height } : undefined}
    >
      <Image {...imgProps} width={width} height={height} />
      {showSkeleton && isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={width && height ? { width, height } : undefined}
        />
      )}
      {hasError && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          style={width && height ? { width, height } : undefined}
        >
          <span className="text-gray-400 text-xs">Erreur</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;

/* ---------------- Variantes ---------------- */

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
    showSkeleton={false}
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
