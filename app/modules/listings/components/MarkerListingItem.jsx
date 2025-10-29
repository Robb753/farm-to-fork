"use client";

import React, { useCallback } from "react";
import Image from "next/image";
import { Heart } from "@/utils/icons";

/**
 * Props:
 * - item: { id, name, address, price, rating, availability, listingImages, certifications }
 * - onNavigate?: (id: string|number) => void
 * - isFavorite?: boolean
 * - onToggleFavorite?: (id: string|number) => void
 */
function MarkerListingItem({ item, onNavigate, isFavorite, onToggleFavorite }) {
  const id = item?.id;
  const title = item?.name || "Sans nom";
  const address = item?.address || "Adresse non disponible";
  const imageUrl = item?.listingImages?.[0]?.url || "/default-farm-image.jpg";

  // prix (number ou string) → "12,00 €"
  const formattedPrice = (() => {
    const p = item?.price;
    if (p == null || p === "") return null;
    const num = typeof p === "number" ? p : Number(p);
    if (Number.isNaN(num)) return `${p} €`;
    try {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }).format(num);
    } catch {
      return `${num} €`;
    }
  })();

  // statut
  const statusRaw = String(item?.availability || "").toLowerCase();
  const isOpen = statusRaw === "open";

  // navigation: callback > fallback
  const go = useCallback(() => {
    if (!id) return;
    if (onNavigate) onNavigate(id);
    else if (typeof window !== "undefined")
      window.location.href = `/view-listing/${id}`;
  }, [id, onNavigate]);

  const onKey = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={go}
      onKeyDown={onKey}
      className="group rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 max-w-[280px] bg-white cursor-pointer outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      aria-label={`Ouvrir la fiche ${title}`}
    >
      {/* Image */}
      <div className="relative w-full h-[160px]">
        <Image
          src={imageUrl}
          alt={title}
          fill
          sizes="(max-width: 640px) 60vw, 280px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          priority={false}
        />

        {/* Favoris */}
        <button
          type="button"
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-sm hover:bg-white transition-colors z-10"
          aria-label={
            isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"
          }
          aria-pressed={!!isFavorite}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(id);
          }}
        >
          <Heart
            className={`h-5 w-5 ${isFavorite ? "text-red-500" : "text-gray-400"}`}
          />
        </button>

        {/* Statut */}
        <div
          className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${
            isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isOpen ? "Ouvert" : "Fermé"}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-3">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-base text-gray-900 mb-1 truncate flex-1">
            {title}
          </h3>

          {/* Note */}
          {item?.rating != null && !Number.isNaN(Number(item.rating)) && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs font-medium bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3 h-3 mr-0.5"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
                {Number(item.rating).toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Adresse */}
        <p className="text-sm text-gray-600 mb-2 truncate">{address}</p>

        {/* Prix */}
        {formattedPrice && (
          <div className="mt-1">
            <span className="text-gray-900 font-semibold">
              {formattedPrice}
            </span>
            <span className="text-gray-600 text-sm"> / jour</span>
          </div>
        )}

        {/* Certifications */}
        {Array.isArray(item?.certifications) &&
          item.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {item.certifications.slice(0, 2).map((cert, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full"
                >
                  {cert}
                </span>
              ))}
              {item.certifications.length > 2 && (
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  +{item.certifications.length - 2}
                </span>
              )}
            </div>
          )}
      </div>
    </div>
  );
}

export default MarkerListingItem;
