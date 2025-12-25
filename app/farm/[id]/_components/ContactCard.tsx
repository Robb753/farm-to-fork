"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  Mail,
  MapPin,
  Phone,
  Copy,
  ExternalLink,
  MessageCircle,
} from "@/utils/icons";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/types/database";

/**
 * Type pour un listing avec informations de contact
 */
type ListingWithContact = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant ContactCard
 */
interface ContactCardProps {
  listing: ListingWithContact | null;
  className?: string;
}

/**
 * Composant de carte de contact pour un listing
 *
 * Features:
 * - Affichage des informations de contact disponibles
 * - Actions interactives (appeler, envoyer email, copier)
 * - Validation et formatage des URLs/téléphones
 * - Design moderne avec animations
 * - Analytics tracking des interactions
 * - Gestion d'erreurs robuste
 *
 * @param listing - Données du listing avec contacts
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Card de contact interactive
 */
export default function ContactCard({
  listing,
  className,
}: ContactCardProps): JSX.Element | null {
  const [isContacting, setIsContacting] = useState<boolean>(false);

  // Ne pas afficher la card si aucun listing
  if (!listing) {
    return null;
  }

  /**
   * Valide et formate un numéro de téléphone français
   */
  const formatPhoneNumber = useCallback((phone: string): string => {
    // Nettoyer le numéro
    const cleaned = phone.replace(/\D/g, "");

    // Format français standard
    if (cleaned.startsWith("33")) {
      return `+33 ${cleaned.slice(2).replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}`;
    } else if (cleaned.startsWith("0") && cleaned.length === 10) {
      return cleaned.replace(
        /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/,
        "$1 $2 $3 $4 $5"
      );
    }

    return phone;
  }, []);

  /**
   * Valide et formate une URL de site web
   */
  const formatWebsiteUrl = useCallback((url: string): string => {
    if (!url) return "";

    // Ajouter https:// si pas de protocole
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      return `https://${url}`;
    }

    return url;
  }, []);

  /**
   * Copie du texte dans le presse-papier
   */
  const copyToClipboard = useCallback(
    async (text: string, label: string): Promise<void> => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copié dans le presse-papier`);

        // Analytics tracking
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "copy_contact", {
            event_category: "contact_interaction",
            event_label: label.toLowerCase(),
            listing_id: listing.id,
          });
        }
      } catch (error) {
        toast.error("Impossible de copier dans le presse-papier");
      }
    },
    [listing.id]
  );

  /**
   * Gère l'appel téléphonique
   */
  const handlePhoneCall = useCallback((): void => {
    if (!listing.phoneNumber) return;

    try {
      window.location.href = `tel:${listing.phoneNumber}`;

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "phone_call", {
          event_category: "contact_interaction",
          listing_id: listing.id,
        });
      }
    } catch (error) {
      toast.error("Impossible d'initier l'appel");
    }
  }, [listing.phoneNumber, listing.id]);

  /**
   * Gère l'envoi d'email
   */
  const handleEmail = useCallback((): void => {
    const email = listing.email || listing.createdBy;
    if (!email) return;

    try {
      const subject = `Question sur votre ferme "${listing.name || "listing"}"`;
      const body = `Bonjour,\n\nJe suis intéressé(e) par votre ferme et j'aimerais obtenir plus d'informations.\n\nCordialement`;

      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoUrl;

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "email_contact", {
          event_category: "contact_interaction",
          listing_id: listing.id,
        });
      }
    } catch (error) {
      toast.error("Impossible d'ouvrir le client de messagerie");
    }
  }, [listing.email, listing.createdBy, listing.name, listing.id]);

  /**
   * Gère l'ouverture du site web
   */
  const handleWebsiteClick = useCallback((): void => {
    if (!listing.website) return;

    try {
      const url = formatWebsiteUrl(listing.website);
      window.open(url, "_blank", "noopener,noreferrer");

      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "website_visit", {
          event_category: "contact_interaction",
          listing_id: listing.id,
          website_url: url,
        });
      }
    } catch (error) {
      toast.error("Impossible d'ouvrir le site web");
    }
  }, [listing.website, listing.id, formatWebsiteUrl]);

  /**
   * Action principale de contact (multiple options)
   */
  const handleMainContact = useCallback(async (): Promise<void> => {
    setIsContacting(true);

    try {
      // Prioriser email > téléphone > site web
      if (listing.email || listing.createdBy) {
        handleEmail();
      } else if (listing.phoneNumber) {
        handlePhoneCall();
      } else if (listing.website) {
        handleWebsiteClick();
      } else {
        toast.error("Aucun moyen de contact disponible");
      }
    } finally {
      setTimeout(() => setIsContacting(false), 1000);
    }
  }, [listing, handleEmail, handlePhoneCall, handleWebsiteClick]);

  const email = listing.email || listing.createdBy;
  const hasContactInfo = !!(
    listing.address ||
    listing.phoneNumber ||
    email ||
    listing.website
  );

  // Si aucune info de contact, ne pas afficher la card
  if (!hasContactInfo) {
    return null;
  }

  return (
    <Card
      className={cn(
        "overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow",
        className
      )}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-green-700 text-lg">
          <Phone className="h-5 w-5 mr-2" />
          Informations de Contact
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pt-0">
        {/* Adresse */}
        {listing.address && (
          <div className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <MapPin className="h-4 w-4 mt-1 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">Adresse</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                {listing.address}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(listing.address!, "Adresse")}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Téléphone */}
        {listing.phoneNumber && (
          <>
            <Separator />
            <div className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Téléphone</p>
                <p className="text-sm text-gray-600">
                  {formatPhoneNumber(listing.phoneNumber)}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePhoneCall}
                  className="text-green-600 hover:text-green-700"
                >
                  <Phone className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(listing.phoneNumber!, "Numéro")
                  }
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Email */}
        {email && (
          <>
            <Separator />
            <div className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600 truncate">{email}</p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEmail}
                  className="text-green-600 hover:text-green-700"
                >
                  <Mail className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(email, "Email")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Site web */}
        {listing.website && (
          <>
            <Separator />
            <div className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Globe className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Site web</p>
                <p
                  className="text-sm text-blue-600 truncate hover:underline cursor-pointer"
                  onClick={handleWebsiteClick}
                >
                  {listing.website}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleWebsiteClick}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(listing.website!, "Site web")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator />

        {/* Bouton de contact principal */}
        <Button
          onClick={handleMainContact}
          disabled={isContacting}
          className={cn(
            "w-full bg-green-600 hover:bg-green-700 text-white",
            "transition-all duration-200 hover:shadow-md",
            "disabled:opacity-50"
          )}
        >
          {isContacting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
              Contact en cours...
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4 mr-2" />
              Nous contacter
            </>
          )}
        </Button>

        {/* Message d'aide */}
        <p className="text-xs text-gray-500 text-center">
          Cliquez sur les icônes pour des actions rapides
        </p>
      </CardContent>
    </Card>
  );
}
