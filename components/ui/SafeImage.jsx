"use client";

import Image from "next/image";
import { useState } from "react";

export default function SafeImage({
  src,
  alt = "image",
  className = "",
  fill = true,
  width,
  height,
  sizes = "100vw",
  priority = false,
  fallbackSrc = "/placeholder-farm.jpg",
  objectFit = "contain", // "cover" ou "contain"
  ...props
}) {
  const [hasError, setHasError] = useState(false);

  const imgClass = `${className} object-${objectFit} ${hasError ? "bg-gray-100" : ""}`;

  if (fill) {
    return (
      <Image
        src={hasError ? fallbackSrc : src}
        alt={alt}
        fill
        sizes={sizes}
        onError={() => setHasError(true)}
        priority={priority}
        className={imgClass}
        {...props}
      />
    );
  }

  return (
    <Image
      src={hasError ? fallbackSrc : src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      onError={() => setHasError(true)}
      priority={priority}
      className={imgClass}
      {...props}
    />
  );
}
