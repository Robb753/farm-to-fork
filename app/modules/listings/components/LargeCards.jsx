import React from "react";
import Image from "next/image";
import Link from "next/link";

function statusBadge(statusRaw) {
  const s = String(statusRaw || "").toLowerCase();
  if (s === "open")
    return { label: "Ouvert", cls: "bg-green-100 text-green-800" };
  if (s === "closed") return { label: "Fermé", cls: "bg-red-100 text-red-800" };
  if (!s) return null;
  return { label: statusRaw, cls: "bg-yellow-100 text-yellow-800" };
}

function LargeCards({
  img,
  title = "Titre non renseigné",
  description = "",
  buttonText = "Découvrir",
  buttonLink = "#",
  status,
}) {
  const badge = statusBadge(status);

  return (
    <section className="relative py-6">
      {/* Image container with status indicator */}
      <div className="relative h-96 min-w-[300px] overflow-hidden rounded-lg shadow-md">
        <Image
          src={img || "/placeholder-farm.jpg"}
          alt={title || "Illustration"}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
          style={{ objectFit: "cover" }}
          className="transition-transform duration-500 hover:scale-105"
          priority
        />

        {/* Optional status indicator */}
        {badge && (
          <div
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-medium ${badge.cls}`}
          >
            {badge.label}
          </div>
        )}
      </div>

      {/* Content overlay */}
      <div className="pointer-events-none absolute left-6 top-24 max-w-sm sm:left-10 sm:top-32">
        {/* Gradient pour lisibilité sur photos claires */}
        <div className="pointer-events-none absolute -inset-6 rounded-lg bg-gradient-to-r from-black/40 to-transparent" />
        <h3 className="relative text-3xl font-semibold mb-3 text-white drop-shadow-lg">
          {title}
        </h3>
        {description ? (
          <p className="relative text-white text-lg drop-shadow-md mb-5">
            {description}
          </p>
        ) : null}

        {/* Bouton (Link stylé) */}
        <Link
          href={buttonLink}
          className="relative pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          aria-label={buttonText}
        >
          {buttonText}
        </Link>
      </div>
    </section>
  );
}

// Variante: Card style plutôt que overlay
function LargeCardAlternate({
  img,
  title = "Titre non renseigné",
  description = "",
  buttonText = "Découvrir",
  buttonLink = "#",
  status,
}) {
  const badge = statusBadge(status);

  return (
    <section className="relative my-6">
      <div className="overflow-hidden rounded-lg shadow-md bg-white border border-gray-200">
        {/* Image container */}
        <div className="relative h-64 w-full">
          <Image
            src={img || "/placeholder-farm.jpg"}
            alt={title || "Illustration"}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
            style={{ objectFit: "cover" }}
            className="transition-transform duration-500 hover:scale-105"
          />

          {/* Optional status indicator */}
          {badge && (
            <div
              className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-medium ${badge.cls}`}
            >
              {badge.label}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-2xl font-semibold mb-2 text-gray-900">{title}</h3>
          {description ? (
            <p className="text-gray-600 mb-5">{description}</p>
          ) : null}

          <Link
            href={buttonLink}
            className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            aria-label={buttonText}
          >
            {buttonText}
          </Link>
        </div>
      </div>
    </section>
  );
}

export { LargeCardAlternate };
export default LargeCards;
