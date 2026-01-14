"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import eventsData from "@/app/_data/eventsData.json";
import Breadcrumb from "@/app/_components/Breadcrumb";
import { COLORS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les événements (identique à la page liste)
 */
interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  date: string;
  category: string;
  price?: number;
  organizer?: string;
  capacity?: number;
  registeredCount?: number;
  longDescription?: string;
  prerequisites?: string[];
  whatToBring?: string[];
  contactEmail?: string;
  contactPhone?: string;
}

/**
 * Interface pour les paramètres de la route
 */
interface EventDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * Page de détail d'un événement
 * 
 * Features:
 * - Affichage détaillé d'un événement spécifique
 * - Navigation avec breadcrumb
 * - Informations pratiques complètes
 * - Design responsive et accessible
 */
export default function EventDetailPage({ params }: EventDetailPageProps): JSX.Element {
  // Cast du type pour TypeScript
  const events = eventsData as Event[];
  const event = events.find((e) => e.id === Number(params.id));

  if (!event) {
    notFound();
  }

  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();
  const isSoldOut = event.capacity && event.registeredCount && event.registeredCount >= event.capacity;

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* ✅ Fil d'Ariane avec composant dédié */}
      <Breadcrumb />

      {/* ✅ Hero Header enrichi */}
      <section 
        className="py-12 rounded-3xl mb-8 shadow-md"
        style={{ backgroundColor: COLORS.PRIMARY_BG }}
      >
        <div className="text-center px-6">
          {/* Badge de statut */}
          {(isSoldOut || !isUpcoming) && (
            <div className="mb-4">
              <span 
                className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
                style={{
                  backgroundColor: isSoldOut ? COLORS.ERROR : COLORS.WARNING,
                  color: COLORS.BG_WHITE,
                }}
              >
                {isSoldOut ? "🚫 Événement complet" : "⏰ Événement terminé"}
              </span>
            </div>
          )}

          <h1 
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ color: COLORS.PRIMARY_DARK }}
          >
            {event.title}
          </h1>
          
          <p 
            className="text-lg max-w-3xl mx-auto mb-6"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            {event.longDescription || event.description}
          </p>

          {/* ✅ Informations pratiques en grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div 
              className="flex flex-col items-center p-4 rounded-lg"
              style={{ backgroundColor: COLORS.BG_WHITE }}
            >
              <div className="text-2xl mb-2">📍</div>
              <div 
                className="font-medium mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Lieu
              </div>
              <div 
                className="text-sm text-center"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {event.location}
              </div>
            </div>

            <div 
              className="flex flex-col items-center p-4 rounded-lg"
              style={{ backgroundColor: COLORS.BG_WHITE }}
            >
              <div className="text-2xl mb-2">📅</div>
              <div 
                className="font-medium mb-1"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Date
              </div>
              <div 
                className="text-sm text-center"
                style={{ color: COLORS.TEXT_SECONDARY }}
              >
                {eventDate.toLocaleDateString("fr-FR", {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

            {event.price !== undefined && (
              <div 
                className="flex flex-col items-center p-4 rounded-lg"
                style={{ backgroundColor: COLORS.BG_WHITE }}
              >
                <div className="text-2xl mb-2">💰</div>
                <div 
                  className="font-medium mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Prix
                </div>
                <div 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {event.price === 0 ? "Gratuit" : `${event.price}€`}
                </div>
              </div>
            )}

            {event.capacity && (
              <div 
                className="flex flex-col items-center p-4 rounded-lg"
                style={{ backgroundColor: COLORS.BG_WHITE }}
              >
                <div className="text-2xl mb-2">👥</div>
                <div 
                  className="font-medium mb-1"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Places
                </div>
                <div 
                  className="text-sm"
                  style={{ color: COLORS.TEXT_SECONDARY }}
                >
                  {event.registeredCount || 0}/{event.capacity}
                </div>
              </div>
            )}
          </div>

          {/* ✅ Badge catégorie */}
          <div className="mt-6">
            <span 
              className="inline-block px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: `${COLORS.PRIMARY}20`,
                color: COLORS.PRIMARY,
              }}
            >
              {event.category}
            </span>
          </div>
        </div>
      </section>

      {/* ✅ Sections d'informations détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description détaillée */}
          <div 
            className="p-6 rounded-lg border"
            style={{
              backgroundColor: COLORS.BG_WHITE,
              borderColor: COLORS.BORDER,
            }}
          >
            <h2 
              className="text-xl font-semibold mb-4"
              style={{ color: COLORS.TEXT_PRIMARY }}
            >
              📋 Description
            </h2>
            <p style={{ color: COLORS.TEXT_SECONDARY }}>
              {event.longDescription || event.description}
            </p>
          </div>

          {/* Prérequis */}
          {event.prerequisites && event.prerequisites.length > 0 && (
            <div 
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h3 
                className="font-semibold mb-3"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                ✅ Prérequis
              </h3>
              <ul className="space-y-2">
                {event.prerequisites.map((prerequisite, index) => (
                  <li 
                    key={index}
                    className="flex items-start space-x-2"
                  >
                    <span 
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: COLORS.PRIMARY }}
                    />
                    <span style={{ color: COLORS.TEXT_SECONDARY }}>
                      {prerequisite}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* À apporter */}
          {event.whatToBring && event.whatToBring.length > 0 && (
            <div 
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h3 
                className="font-semibold mb-3"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                🎒 À apporter
              </h3>
              <ul className="space-y-2">
                {event.whatToBring.map((item, index) => (
                  <li 
                    key={index}
                    className="flex items-start space-x-2"
                  >
                    <span 
                      className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                      style={{ backgroundColor: COLORS.SUCCESS }}
                    />
                    <span style={{ color: COLORS.TEXT_SECONDARY }}>
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar avec actions */}
        <div className="space-y-6">
          {/* Organisateur */}
          {event.organizer && (
            <div 
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: COLORS.PRIMARY_BG,
                borderColor: `${COLORS.PRIMARY}20`,
              }}
            >
              <h3 
                className="font-semibold mb-3"
                style={{ color: COLORS.PRIMARY }}
              >
                👤 Organisateur
              </h3>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                {event.organizer}
              </p>
            </div>
          )}

          {/* Contact */}
          {(event.contactEmail || event.contactPhone) && (
            <div 
              className="p-6 rounded-lg border"
              style={{
                backgroundColor: COLORS.BG_WHITE,
                borderColor: COLORS.BORDER,
              }}
            >
              <h3 
                className="font-semibold mb-3"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                📞 Contact
              </h3>
              <div className="space-y-2">
                {event.contactEmail && (
                  <div>
                    <a 
                      href={`mailto:${event.contactEmail}`}
                      className={cn(
                        "hover:underline transition-colors duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                      )}
                      style={{ color: COLORS.PRIMARY }}
                    >
                      📧 {event.contactEmail}
                    </a>
                  </div>
                )}
                {event.contactPhone && (
                  <div>
                    <a 
                      href={`tel:${event.contactPhone}`}
                      className={cn(
                        "hover:underline transition-colors duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
                      )}
                      style={{ color: COLORS.PRIMARY }}
                    >
                      📱 {event.contactPhone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bouton d'inscription */}
          {isUpcoming && !isSoldOut && (
            <div 
              className="p-6 rounded-lg text-center"
              style={{
                backgroundColor: COLORS.SUCCESS_BG || `${COLORS.SUCCESS}10`,
                border: `2px solid ${COLORS.SUCCESS}20`,
              }}
            >
              <h3 
                className="font-semibold mb-3"
                style={{ color: COLORS.SUCCESS }}
              >
                🎯 S'inscrire
              </h3>
              <button
                className={cn(
                  "w-full px-6 py-3 rounded-lg font-semibold",
                  "transition-all duration-200 hover:shadow-md",
                  "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                )}
                style={{
                  backgroundColor: COLORS.SUCCESS,
                  color: COLORS.BG_WHITE,
                }}
              >
                Réserver ma place
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Bouton Retour */}
      <div className="text-center">
        <Link
          href="/events"
          className={cn(
            "inline-flex items-center px-6 py-3 rounded-lg font-semibold",
            "transition-all duration-200 hover:shadow-md",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          )}
          style={{
            backgroundColor: COLORS.PRIMARY,
            color: COLORS.BG_WHITE,
          }}
        >
          ← Retour aux événements
        </Link>
      </div>
    </div>
  );
}