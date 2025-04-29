"use client";

import Link from "next/link";
import eventsData from "@/app/_data/eventsData.json";

export default function EventsPage() {
  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-center mb-12">
        Événements à venir
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {eventsData.map((event) => (
          <div
            key={event.id}
            className="relative flex flex-col justify-between bg-gradient-to-br from-green-50 to-white p-6 rounded-3xl shadow-md hover:shadow-lg transition-all duration-300 h-80"
          >
            <div>
              {/* Titre */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                {event.title}
              </h2>

              {/* Description */}
              <p className="text-gray-700 text-sm mb-4">{event.description}</p>

              {/* Lieu et Date sur 2 lignes */}
              <div className="text-gray-500 text-sm">
                📍 {event.location}
                <br />
                📅 {new Date(event.date).toLocaleDateString("fr-FR")}
              </div>
            </div>

            {/* Footer de carte : badge + lien */}
            <div className="flex items-center justify-between mt-6">
              <span
                className={`inline-block px-4 py-1 text-xs font-semibold rounded-full ${getBadgeColor(
                  event.category
                )}`}
              >
                {event.category}
              </span>

              <Link
                href={`/events/${event.id}`}
                className="text-green-600 hover:text-green-800 text-sm font-medium transition"
              >
                Voir plus →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Fonction pour choisir dynamiquement la couleur du badge selon la catégorie
 */
function getBadgeColor(category) {
  switch (category.toLowerCase()) {
    case "marché":
      return "bg-green-100 text-green-800";
    case "atelier":
      return "bg-blue-100 text-blue-800";
    case "dégustation":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-200 text-gray-700";
  }
}
