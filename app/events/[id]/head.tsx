import { Metadata } from "next";
import eventsData from "@/app/_data/eventsData.json";

/**
 * Interface pour les événements (identique aux autres composants)
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
interface GenerateMetadataProps {
  params: {
    id: string;
  };
}

/**
 * Génère les métadonnées pour une page d'événement spécifique
 * 
 * Features:
 * - SEO optimisé avec titre et description
 * - Open Graph pour les réseaux sociaux
 * - Gestion des cas d'erreur (événement non trouvé)
 * - Métadonnées enrichies avec informations de l'événement
 */
export async function generateMetadata({ 
  params 
}: GenerateMetadataProps): Promise<Metadata> {
  // Cast du type pour TypeScript
  const events = eventsData as Event[];
  const event = events.find((e) => e.id === Number(params.id));

  if (!event) {
    return { 
      title: "Événement non trouvé | Farm To Fork",
      description: "L'événement que vous recherchez n'existe pas ou a été supprimé.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  // Formatage de la date pour les métadonnées
  const eventDate = new Date(event.date);
  const formattedDate = eventDate.toLocaleDateString("fr-FR", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Description enrichie pour le SEO
  const enrichedDescription = `${event.description} Événement ${event.category} le ${formattedDate} à ${event.location}.${event.price !== undefined ? ` Prix: ${event.price === 0 ? 'Gratuit' : `${event.price}€`}.` : ''}`;

  return {
    title: `${event.title} | Farm To Fork`,
    description: enrichedDescription,
    keywords: [
      event.category,
      'événement',
      'agriculture locale',
      'producteurs',
      'farm to fork',
      event.location,
      'marché local',
      'circuits courts'
    ],
    authors: [{ name: 'Farm To Fork' }],
    creator: 'Farm To Fork',
    publisher: 'Farm To Fork',
    
    // Open Graph pour les réseaux sociaux
    openGraph: {
      title: event.title,
      description: event.description,
      type: "article",
      siteName: "Farm To Fork",
      locale: "fr_FR",
      url: `/events/${event.id}`,
      images: [
        {
          url: `/api/og/event/${event.id}`, // URL pour image Open Graph générée
          width: 1200,
          height: 630,
          alt: `Image de l'événement ${event.title}`,
        },
      ],
      publishedTime: new Date().toISOString(),
      section: event.category,
      tags: [event.category, 'événement', 'agriculture locale'],
    },

    // Twitter Card
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description,
      images: [`/api/og/event/${event.id}`],
      creator: "@farmtofork", // Remplacez par votre handle Twitter
    },

    // Métadonnées JSON-LD pour le SEO structuré
    other: {
      'application/ld+json': JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Event",
        name: event.title,
        description: event.description,
        startDate: event.date,
        location: {
          "@type": "Place",
          name: event.location,
          address: event.location,
        },
        organizer: {
          "@type": "Organization",
          name: event.organizer || "Farm To Fork",
        },
        offers: event.price !== undefined ? {
          "@type": "Offer",
          price: event.price,
          priceCurrency: "EUR",
          availability: event.capacity && event.registeredCount && event.registeredCount >= event.capacity 
            ? "https://schema.org/SoldOut" 
            : "https://schema.org/InStock",
        } : undefined,
        eventStatus: new Date(event.date) > new Date() 
          ? "https://schema.org/EventScheduled"
          : "https://schema.org/EventCancelled",
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        category: event.category,
      }),
    },

    // Métadonnées robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Liens canoniques et alternates
    alternates: {
      canonical: `/events/${event.id}`,
      languages: {
        'fr-FR': `/events/${event.id}`,
      },
    },

    // Métadonnées pour les applications
    appleWebApp: {
      capable: true,
      title: event.title,
      statusBarStyle: 'default',
    },

    // Catégorie du contenu
    category: event.category,
  };
}