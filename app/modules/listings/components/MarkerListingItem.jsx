// modules/listings/components/MarkerListingItem.jsx
import React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "@/utils/icons";
import Image from "next/image";

function MarkerListingItem({ item }) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/view-listing/${item.id}`);
  };

  // Récupérer l'image principale de la ferme ou une image par défaut
  const imageUrl = item?.listingImages?.[0]?.url || "/default-farm-image.jpg";

  // Formater le prix si disponible
  const formattedPrice = item?.price ? `${item.price} €` : null;

  // Déterminer le statut d'ouverture
  const isOpen = item?.availability === "open";

  return (
    <div
      className="rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 max-w-[280px] bg-white cursor-pointer"
      onClick={handleClick}
    >
      {/* Image principale */}
      <div className="relative w-full h-[160px]">
        <Image
          src={imageUrl}
          alt={item?.name || "Ferme"}
          fill
          className="object-cover"
          sizes="280px"
        />

        {/* Icône de favoris */}
        <button
          className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-90 rounded-full shadow-sm hover:bg-white transition-colors z-10"
          aria-label="Ajouter aux favoris"
          onClick={(e) => {
            e.stopPropagation();
            // Logique d'ajout aux favoris à implémenter
          }}
        >
          <Heart className="h-5 w-5 text-gray-400" />
        </button>

        {/* Badge de statut */}
        <div
          className={`absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${
            isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {isOpen ? "Ouvert" : "Fermé"}
        </div>
      </div>

      {/* Contenu de la carte */}
      <div className="p-3">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-base text-gray-900 mb-1 truncate flex-1">
            {item?.name || "Sans nom"}
          </h3>

          {/* Notation si disponible */}
          {item?.rating && (
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs font-medium bg-green-600 text-white px-1.5 py-0.5 rounded flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3 h-3 mr-0.5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
                    clipRule="evenodd"
                  />
                </svg>
                {item.rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Localisation */}
        <p className="text-sm text-gray-600 mb-2 truncate">
          {item?.address || "Adresse non disponible"}
        </p>

        {/* Prix si disponible */}
        {formattedPrice && (
          <div className="mt-1">
            <span className="text-gray-900 font-semibold">
              {formattedPrice}
            </span>
            <span className="text-gray-600 text-sm"> par jour</span>
          </div>
        )}

        {/* Badges pour les certifications/types de produits */}
        {item?.certifications?.length > 0 && (
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
