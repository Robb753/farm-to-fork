import Image from "next/image";
import React, { useState } from "react";
import Link from "next/link";
import { MapPin, ChevronDown, Clock, Star, Award, Heart } from "lucide-react";
import { useMapListing } from "@/app/contexts/MapListingContext";

function Listing({ onLoadMore, hasMore, isLoading }) {
  const {
    visibleListings,
    hoveredListingId,
    setHoveredListingId,
    selectedListingId,
    setSelectedListingId,
  } = useMapListing() || { visibleListings: [] };

  // ⚙️ Liste des favoris (à connecter avec le backend)
  const [favorites, setFavorites] = useState([]);

  const toggleFavorite = (id, e) => {
    e.preventDefault();
    e.stopPropagation();

    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favId) => favId !== id) : [...prev, id]
    );
  };

  const formatOpeningHours = (hours) => hours || "Horaires non disponibles";
  const formatDistance = (distance) =>
    distance ? `${distance.toFixed(1)} km` : "";

  // Handler pour le survol de l'élément
  const handleMouseEnter = (id) => {
    setHoveredListingId(id);
  };

  const handleMouseLeave = () => {
    setHoveredListingId(null);
  };

  // Handler pour le clic sur l'élément
  const handleListingClick = (e, id) => {
    // Si nous cliquons sur un lien interne, ne pas interrompre la navigation
    if (e.target.tagName.toLowerCase() === "a" || e.target.closest("a")) {
      return;
    }

    e.preventDefault();
    setSelectedListingId(id === selectedListingId ? null : id);

    // Identifier le marqueur correspondant et déclencher un clic
    const marker = document.querySelector(`[data-listing-id="${id}"]`);
    if (marker) {
      marker.click();
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 min-h-screen">
      <div className="flex flex-col gap-3">
        {visibleListings.length > 0 ? (
          <>
            {visibleListings.map((item) => {
              const isHovered = hoveredListingId === item.id;
              const isSelected = selectedListingId === item.id;

              return (
                <div
                  key={item.id}
                  id={`listing-${item.id}`}
                  className={`relative group transition-all duration-200 ${
                    isHovered || isSelected ? "scale-[1.02] shadow-lg" : ""
                  }`}
                  onMouseEnter={() => handleMouseEnter(item.id)}
                  onMouseLeave={handleMouseLeave}
                  onClick={(e) => handleListingClick(e, item.id)}
                >
                  <Link href={`/view-listing/${item.id}`} className="block">
                    <div
                      className={`flex flex-col sm:flex-row items-start bg-white border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${
                        isHovered || isSelected ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      {/* Conteneur d'image */}
                      <div className="relative w-full sm:w-40 md:w-48 lg:w-56 h-48 flex-shrink-0">
                        <Image
                          src={
                            item?.listingImages?.[0]?.url ||
                            "/default-image.jpg"
                          }
                          width={300}
                          height={200}
                          className="object-cover w-full h-full"
                          alt={`Listing image ${item.id}`}
                          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
                          priority
                        />

                        {/* Distance badge */}
                        {item.distance && (
                          <div className="absolute top-2 left-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                            {formatDistance(item.distance)}
                          </div>
                        )}

                        {/* Bouton favori */}
                        <button
                          onClick={(e) => toggleFavorite(item.id, e)}
                          className="absolute top-2 right-2 z-20 bg-white p-1.5 rounded-full shadow hover:scale-110 transition"
                          aria-label={
                            favorites.includes(item.id)
                              ? "Retirer des favoris"
                              : "Ajouter aux favoris"
                          }
                        >
                          {favorites.includes(item.id) ? (
                            <Heart className="text-red-500 fill-red-500 h-5 w-5" />
                          ) : (
                            <Heart className="text-gray-400 h-5 w-5" />
                          )}
                        </button>
                      </div>

                      {/* Contenu texte */}
                      {/* Contenu texte */}
                      <div className="flex flex-col flex-grow p-3 sm:p-4 w-full min-w-0">
                        <div>
                          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1 truncate">
                            {item?.name || "Sans nom"}
                          </h2>

                          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 mb-2">
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-primary" />
                            <span className="truncate">
                              {item?.address || "Adresse non disponible"}
                            </span>
                          </div>

                          {item?.description && (
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 sm:mb-3">
                              {item.description}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
                            {item?.openingHours && (
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-primary" />
                                <span className="truncate max-w-[150px]">
                                  {formatOpeningHours(item.openingHours)}
                                </span>
                              </div>
                            )}
                            {item?.certifications?.length > 0 && (
                              <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600">
                                <Award className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0 text-green-600" />
                                <span className="truncate max-w-[120px]">
                                  {item.certifications.slice(0, 1).join(", ")}
                                  {item.certifications.length > 1 && (
                                    <span>
                                      {" "}
                                      +{item.certifications.length - 1}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {item?.products?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {item.products
                                .slice(0, 2)
                                .map((product, index) => (
                                  <span
                                    key={index}
                                    className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
                                  >
                                    {product}
                                  </span>
                                ))}
                              {item.products.length > 2 && (
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                  +{item.products.length - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Pied de carte avec notation et disponibilité */}
                        <div className="flex items-center justify-between mt-auto pt-1">
                          {item?.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-xs sm:text-sm font-medium">
                                {item.rating.toFixed(1)}
                              </span>
                              {item.reviewCount && (
                                <span className="text-xs text-gray-500">
                                  ({item.reviewCount})
                                </span>
                              )}
                            </div>
                          )}
                          {item?.availability && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                item.availability === "open"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {item.availability === "open"
                                ? "Ouvert"
                                : "Fermé"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}

            {/* Bouton "Charger plus" avec indicateur de chargement */}
            {hasMore && (
              <button
                onClick={onLoadMore}
                disabled={isLoading}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg flex items-center justify-center gap-2 disabled:bg-primary/70"
              >
                {isLoading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Chargement...
                  </>
                ) : (
                  <>
                    Charger plus <ChevronDown className="w-5 h-5" />
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <p className="text-gray-500 text-center mb-4">
              Aucun résultat trouvé.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Listing;
