// app/events/page.tsx
import Link from "next/link";
import eventsData from "@/app/_data/eventsData.json";
import { COLORS, PATHS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les événements
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
}

/**
 * Types de catégories d'événements
 */
type EventCategory =
  | "marché"
  | "atelier"
  | "dégustation"
  | "visite"
  | "formation"
  | string;

/**
 * Configuration des badges par catégorie
 */
interface BadgeConfig {
  bg: string;
  text: string;
  emoji: string;
}

/**
 * Page listant tous les événements à venir
 *
 * Features:
 * - Grid responsive des événements
 * - Badges colorés par catégorie
 * - Design cards avec gradient
 * - Configuration centralisée des couleurs
 */
export default function EventsPage(): JSX.Element {
  // Cast du type pour TypeScript
  const events = eventsData as Event[];

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* ✅ En-tête de page */}
      <div className="text-center mb-12">
        <h1
          className="text-4xl font-bold mb-4"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          Événements à venir
        </h1>
        <p
          className="text-lg max-w-2xl mx-auto"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          Découvrez les marchés, ateliers et dégustations organisés par nos
          producteurs locaux
        </p>
      </div>

      {/* ✅ Filtre rapide par catégorie */}
      <div className="flex flex-wrap justify-center gap-3 mb-8">
        {["Tous", "Marché", "Atelier", "Dégustation", "Visite"].map(
          (filter) => (
            <button
              key={filter}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium",
                "border transition-colors duration-200",
                "hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              )}
              style={{
                borderColor: COLORS.BORDER,
                color: COLORS.TEXT_SECONDARY,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.PRIMARY_BG;
                e.currentTarget.style.borderColor = COLORS.PRIMARY;
                e.currentTarget.style.color = COLORS.PRIMARY;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.borderColor = COLORS.BORDER;
                e.currentTarget.style.color = COLORS.TEXT_SECONDARY;
              }}
            >
              {filter}
            </button>
          )
        )}
      </div>

      {/* ✅ Grid des événements */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>

      {/* ✅ Section call-to-action */}
      <div className="mt-16 text-center">
        <div
          className="max-w-2xl mx-auto p-8 rounded-2xl border"
          style={{
            backgroundColor: COLORS.PRIMARY_BG,
            borderColor: `${COLORS.PRIMARY}20`,
          }}
        >
          <h3
            className="text-xl font-semibold mb-4"
            style={{ color: COLORS.PRIMARY }}
          >
            🎯 Vous organisez un événement ?
          </h3>
          <p className="mb-6" style={{ color: COLORS.TEXT_SECONDARY }}>
            Référencez votre marché, atelier ou dégustation sur notre plateforme
            pour toucher plus de participants.
          </p>
          <Link
            href={PATHS.CONTACT}
            className={cn(
              "inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold",
              "transition-all duration-200 hover:shadow-md",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            )}
            style={{
              backgroundColor: COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
          >
            Proposer un événement
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Composant de carte d'événement individuelle
 */
function EventCard({ event }: { event: Event }): JSX.Element {
  const badgeConfig = getBadgeConfig(event.category);
  const eventDate = new Date(event.date);
  const isUpcoming = eventDate > new Date();
  const isSoldOut =
    event.capacity &&
    event.registeredCount &&
    event.registeredCount >= event.capacity;

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between p-6 rounded-3xl shadow-md",
        "hover:shadow-lg transition-all duration-300 h-80",
        "bg-gradient-to-br from-green-50 to-white"
      )}
    >
      {/* ✅ Badge statut en haut à droite */}
      {(isSoldOut || !isUpcoming) && (
        <div
          className="absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-semibold"
          style={{
            backgroundColor: isSoldOut ? COLORS.ERROR : COLORS.WARNING,
            color: COLORS.BG_WHITE,
          }}
        >
          {isSoldOut ? "Complet" : !isUpcoming ? "Terminé" : ""}
        </div>
      )}

      <div>
        {/* ✅ Titre */}
        <h2
          className="text-2xl font-semibold mb-3"
          style={{ color: COLORS.TEXT_PRIMARY }}
        >
          {event.title}
        </h2>

        {/* ✅ Description */}
        <p
          className="text-sm mb-4 line-clamp-3"
          style={{ color: COLORS.TEXT_SECONDARY }}
        >
          {event.description}
        </p>

        {/* ✅ Informations pratiques */}
        <div className="text-sm space-y-1" style={{ color: COLORS.TEXT_MUTED }}>
          <div className="flex items-center space-x-2">
            <span>📍</span>
            <span>{event.location}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span>📅</span>
            <span>
              {eventDate.toLocaleDateString("fr-FR", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
          {event.price !== undefined && (
            <div className="flex items-center space-x-2">
              <span>💰</span>
              <span>{event.price === 0 ? "Gratuit" : `${event.price}€`}</span>
            </div>
          )}
          {event.capacity && (
            <div className="flex items-center space-x-2">
              <span>👥</span>
              <span>
                {event.registeredCount || 0}/{event.capacity} places
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ✅ Footer avec badge et lien */}
      <div className="flex items-center justify-between mt-6">
        <span
          className={cn(
            "inline-flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-full"
          )}
          style={{
            backgroundColor: badgeConfig.bg,
            color: badgeConfig.text,
          }}
        >
          <span>{badgeConfig.emoji}</span>
          <span>{event.category}</span>
        </span>

        <Link
          href={`/events/${event.id}`}
          className={cn(
            "text-sm font-medium transition-colors duration-200",
            "hover:underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded"
          )}
          style={{ color: COLORS.PRIMARY }}
        >
          Voir plus →
        </Link>
      </div>
    </div>
  );
}

/**
 * Fonction pour obtenir la configuration du badge selon la catégorie
 */
function getBadgeConfig(category: EventCategory): BadgeConfig {
  switch ((category || "").toLowerCase()) {
    case "marché":
      return {
        bg: "#dcfce7", // green-100
        text: "#166534", // green-800
        emoji: "🏪",
      };
    case "atelier":
      return {
        bg: "#dbeafe", // blue-100
        text: "#1e40af", // blue-800
        emoji: "🔨",
      };
    case "dégustation":
      return {
        bg: "#f3e8ff", // purple-100
        text: "#6b21a8", // purple-800
        emoji: "🍷",
      };
    case "visite":
      return {
        bg: "#fef3c7", // amber-100
        text: "#92400e", // amber-800
        emoji: "🚶",
      };
    case "formation":
      return {
        bg: "#fce7f3", // pink-100
        text: "#be185d", // pink-800
        emoji: "📚",
      };
    default:
      return {
        bg: "#f3f4f6", // gray-100
        text: "#374151", // gray-700
        emoji: "📅",
      };
  }
}
