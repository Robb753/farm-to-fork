// components/ui/OptimizedImage.tsx
"use client";

import Image, { ImageProps as NextImageProps } from "next/image";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

/**
 * Types pour OptimizedImage
 */
interface OptimizedImageProps {
  // Props de base
  src?: string;
  alt: string;

  // Dimensionnement
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;

  // Rendu & performance
  priority?: boolean;
  quality?: number;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";

  // UX état
  className?: string;
  showSkeleton?: boolean;

  // Placeholder/blur
  placeholder?: "blur" | "empty";
  blurDataURL?: string;

  // Fallback
  fallbackSrc?: string;

  // Callbacks
  onError?: () => void;
  onLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;

  // Wrapper custom
  wrapperClassName?: string;

  // Props additionnelles pour Next Image
  style?: React.CSSProperties;
  loading?: "eager" | "lazy";
}

/**
 * 🖼️ OptimizedImage — Wrapper Next.js amélioré avec gestion d'erreurs
 *
 * Features:
 * - Fallback automatique si image échoue
 * - Skeleton loading avec animation
 * - Support fill et width/height modes
 * - Blur placeholder par défaut
 * - Types TypeScript complets
 *
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/image.jpg"
 *   alt="Description"
 *   width={300}
 *   height={200}
 *   priority
 * />
 * ```
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt = "image",
  // Dimensionnement
  fill,
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
  // Props additionnelles
  style,
  loading,
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

  const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoading(false);
    onLoad?.(e);
  };

  const handleError = () => {
    if (!hasError && fallbackSrc) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
    setIsLoading(false);
    onError?.();
  };

  const resolvedPlaceholder =
    blurDataURL || placeholder === "blur" ? "blur" : "empty";

  // Classes avec transition smooth
  const imageClasses = cn(
    className,
    isLoading ? "opacity-0" : "opacity-100",
    "transition-opacity duration-300"
  );

  // Props sûrs pour Next/Image avec src garanti
  const resolvedSrc = imgSrc || fallbackSrc;
  if (!resolvedSrc) {
    console.warn("⚠️ OptimizedImage: aucun src ou fallbackSrc défini !");
    return null;
  }

  const imageProps: Partial<NextImageProps> = {
    src: resolvedSrc,
    alt,
    quality,
    onLoad: handleLoad,
    onError: handleError,
    placeholder: resolvedPlaceholder,
    blurDataURL: blurDataURL || defaultBlurDataURL,
    sizes: fill ? (sizes ?? "100vw") : sizes,
    className: imageClasses,
    priority,
    loading: priority ? undefined : loading || "lazy",
    style: { objectFit, ...style },
    ...props,
  };

  // Mode fill
  if (fill) {
    const { width: _, height: __, ...safeProps } = imageProps;
    const fillProps: NextImageProps = {
      ...safeProps,
      src: resolvedSrc, // ✅ src garanti
      alt, // ✅ alt explicitement inclus
      fill: true, // ✅ mode fill activé
    };

    return (
      <div
        className={cn(
          "relative w-full h-full overflow-hidden",
          wrapperClassName
        )}
      >
        <Image {...fillProps} />

        {/* Skeleton loading */}
        {showSkeleton && isLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        {/* Error state */}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <span className="text-gray-400 text-sm">Image non disponible</span>
          </div>
        )}
      </div>
    );
  }

  // Mode width/height
  if (!width || !height) {
    console.warn("⚠️ OptimizedImage: width et height requis en mode non-fill");
    return null;
  }

  const sizedProps: NextImageProps = {
    ...imageProps,
    src: resolvedSrc, // ✅ src garanti
    alt, // ✅ alt explicitement passé
    width, // ✅ width garanti
    height, // ✅ height garanti
  };

  return (
    <div
      className={cn("relative inline-block", wrapperClassName)}
      style={{ width, height }}
    >
      <Image {...sizedProps} />

      {/* Skeleton loading */}
      {showSkeleton && isLoading && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{ width, height }}
        />
      )}

      {/* Error state */}
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

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;

/* ================ VARIANTES SPÉCIALISÉES ================ */

/**
 * Props pour les variantes spécialisées
 */
interface AvatarImageProps
  extends Omit<OptimizedImageProps, "width" | "height" | "fill"> {
  size?: number;
}

interface ListingImageProps
  extends Omit<OptimizedImageProps, "width" | "height" | "fill"> {}

interface HeroImageProps
  extends Omit<OptimizedImageProps, "width" | "height" | "fill"> {}

interface ThumbnailImageProps extends Omit<OptimizedImageProps, "fill"> {
  width?: number;
  height?: number;
}

/**
 * Image avatar circulaire
 */
export const AvatarImage: React.FC<AvatarImageProps> = ({
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
    className={cn("rounded-full", className)}
    sizes="(max-width: 768px) 40px, 60px"
    quality={90}
    showSkeleton={false}
    {...props}
  />
);

/**
 * Image de listing (mode fill)
 */
export const ListingImage: React.FC<ListingImageProps> = ({
  src,
  alt,
  className = "",
  ...props
}) => (
  <OptimizedImage
    src={src}
    alt={alt}
    fill
    className={cn("object-cover", className)}
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    quality={80}
    {...props}
  />
);

/**
 * Image hero (mode fill avec priorité)
 */
export const HeroImage: React.FC<HeroImageProps> = ({
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
    className={cn("object-cover", className)}
    sizes="100vw"
    quality={85}
    priority={priority}
    {...props}
  />
);

/**
 * Image miniature
 */
export const ThumbnailImage: React.FC<ThumbnailImageProps> = ({
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
    className={cn("object-cover rounded", className)}
    sizes="(max-width: 768px) 80px, 100px"
    quality={75}
    {...props}
  />
);

/**
 * Export des types pour utilisation externe
 */
export type {
  OptimizedImageProps,
  AvatarImageProps,
  ListingImageProps,
  HeroImageProps,
  ThumbnailImageProps,
};
