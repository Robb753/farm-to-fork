import React from "react";
import Image from "next/image";
import Link from "next/link";

function LargeCards({
  img,
  title,
  description,
  buttonText,
  buttonLink = "#",
  status,
}) {
  return (
    <section className="relative py-6">
      {/* Image container with status indicator */}
      <div className="relative h-96 min-w-[300px] overflow-hidden rounded-lg shadow-md">
        <Image
          src={img}
          alt={title}
          fill
          style={{ objectFit: "cover" }}
          className="transition-transform duration-500 hover:scale-105"
        />

        {/* Optional status indicator */}
        {status && (
          <div
            className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-medium ${
              status === "open"
                ? "bg-green-100 text-green-800"
                : status === "closed"
                ? "bg-red-100 text-red-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {status === "open"
              ? "Ouvert"
              : status === "closed"
              ? "Fermé"
              : status}
          </div>
        )}
      </div>

      {/* Content overlay */}
      <div className="absolute top-32 left-10 max-w-sm">
        <h3 className="text-3xl font-semibold mb-3 text-white drop-shadow-lg">
          {title}
        </h3>
        <p className="text-white text-lg drop-shadow-md mb-5">{description}</p>

        <Link href={buttonLink}>
          <button className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            {buttonText}
          </button>
        </Link>
      </div>
    </section>
  );
}

// Variante: Card style plutôt que overlay
function LargeCardAlternate({
  img,
  title,
  description,
  buttonText,
  buttonLink = "#",
  status,
}) {
  return (
    <section className="relative my-6">
      <div className="overflow-hidden rounded-lg shadow-md bg-white border border-gray-200">
        {/* Image container */}
        <div className="relative h-64 w-full">
          <Image
            src={img}
            alt={title}
            fill
            style={{ objectFit: "cover" }}
            className="transition-transform duration-500 hover:scale-105"
          />

          {/* Optional status indicator */}
          {status && (
            <div
              className={`absolute top-4 right-4 px-3 py-1.5 rounded-full text-sm font-medium ${
                status === "open"
                  ? "bg-green-100 text-green-800"
                  : status === "closed"
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {status === "open"
                ? "Ouvert"
                : status === "closed"
                ? "Fermé"
                : status}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-2xl font-semibold mb-2 text-gray-900">{title}</h3>
          <p className="text-gray-600 mb-5">{description}</p>

          <Link href={buttonLink}>
            <button className="w-full px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
              {buttonText}
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export { LargeCardAlternate };
export default LargeCards;
