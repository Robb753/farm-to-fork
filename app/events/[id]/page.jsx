"use client";

import { notFound } from "next/navigation";
import eventsData from "@/app/_data/eventsData.json";

export default function EventDetailPage({ params }) {
  const event = eventsData.find((e) => e.id === Number(params.id));

  if (!event) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Fil d'Ariane */}
      <nav className="text-sm mb-8">
        <ul className="flex items-center space-x-2 text-gray-500">
          <li>
            <a href="/" className="hover:text-green-700 transition">
              Accueil
            </a>
          </li>
          <li>/</li>
          <li>
            <a href="/events" className="hover:text-green-700 transition">
              Événements
            </a>
          </li>
          <li>/</li>
          <li className="text-gray-900 font-semibold">{event.title}</li>
        </ul>
      </nav>

      {/* Hero Header */}
      <section className="bg-green-50 py-12 rounded-3xl mb-8 shadow-md">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-green-700 mb-4">
            {event.title}
          </h1>
          <p className="text-gray-700 text-lg max-w-2xl mx-auto">
            {event.description}
          </p>
          <div className="mt-6 flex flex-col md:flex-row justify-center items-center space-y-2 md:space-y-0 md:space-x-4 text-gray-600 text-sm">
            <p>📍 {event.location}</p>
            <p>📅 {new Date(event.date).toLocaleDateString("fr-FR")}</p>
            <span className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
              {event.category}
            </span>
          </div>
        </div>
      </section>

      {/* Bouton Retour */}
      <div className="text-center">
        <a
          href="/events"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-full transition"
        >
          ← Retour aux événements
        </a>
      </div>
    </div>
  );
}
