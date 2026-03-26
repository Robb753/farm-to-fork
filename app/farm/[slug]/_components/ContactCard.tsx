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

type ListingWithContact = Database["public"]["Tables"]["listing"]["Row"];

interface ContactCardProps {
  listing: ListingWithContact | null;
  className?: string;
}

export default function ContactCard({
  listing,
  className,
}: ContactCardProps): JSX.Element | null {
  const [isContacting, setIsContacting] = useState<boolean>(false);

  // ✅ valeurs sûres (permet hooks même si listing=null)
  const listingId = listing?.id ?? null;
  const email = listing?.email ?? null;
  const phoneNumber = listing?.phoneNumber ?? null;
  const website = listing?.website ?? null;
  const address = listing?.address ?? null;
  const name = listing?.name ?? "listing";

  /**
   * Valide et formate un numéro de téléphone français
   */
  const formatPhoneNumber = useCallback((phone: string): string => {
    const cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("33")) {
      return `+33 ${cleaned
        .slice(2)
        .replace(/(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")}`;
    }

    if (cleaned.startsWith("0") && cleaned.length === 10) {
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

        if (typeof window !== "undefined" && window.gtag && listingId) {
          window.gtag("event", "copy_contact", {
            event_category: "contact_interaction",
            event_label: label.toLowerCase(),
            listing_id: listingId,
          });
        }
      } catch {
        toast.error("Impossible de copier dans le presse-papier");
      }
    },
    [listingId]
  );

  /**
   * Gère l'appel téléphonique
   */
  const handlePhoneCall = useCallback((): void => {
    if (!phoneNumber) return;

    try {
      window.location.href = `tel:${phoneNumber}`;

      if (typeof window !== "undefined" && window.gtag && listingId) {
        window.gtag("event", "phone_call", {
          event_category: "contact_interaction",
          listing_id: listingId,
        });
      }
    } catch {
      toast.error("Impossible d'initier l'appel");
    }
  }, [phoneNumber, listingId]);

  /**
   * Gère l'envoi d'email
   */
  const handleEmail = useCallback((): void => {
    if (!email) return;

    try {
      const subject = `Question sur votre ferme "${name}"`;
      const body =
        "Bonjour,\n\nJe suis intéressé(e) par votre ferme et j'aimerais obtenir plus d'informations.\n\nCordialement";

      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;

      window.location.href = mailtoUrl;

      if (typeof window !== "undefined" && window.gtag && listingId) {
        window.gtag("event", "email_contact", {
          event_category: "contact_interaction",
          listing_id: listingId,
        });
      }
    } catch {
      toast.error("Impossible d'ouvrir le client de messagerie");
    }
  }, [email, name, listingId]);

  /**
   * Gère l'ouverture du site web
   */
  const handleWebsiteClick = useCallback((): void => {
    if (!website) return;

    try {
      const url = formatWebsiteUrl(website);
      window.open(url, "_blank", "noopener,noreferrer");

      if (typeof window !== "undefined" && window.gtag && listingId) {
        window.gtag("event", "website_visit", {
          event_category: "contact_interaction",
          listing_id: listingId,
          website_url: url,
        });
      }
    } catch {
      toast.error("Impossible d'ouvrir le site web");
    }
  }, [website, listingId, formatWebsiteUrl]);

  /**
   * Action principale de contact
   */
  const handleMainContact = useCallback(async (): Promise<void> => {
    setIsContacting(true);

    try {
      if (email) {
        handleEmail();
      } else if (phoneNumber) {
        handlePhoneCall();
      } else if (website) {
        handleWebsiteClick();
      } else {
        toast.error("Aucun moyen de contact disponible");
      }
    } finally {
      setTimeout(() => setIsContacting(false), 1000);
    }
  }, [
    email,
    phoneNumber,
    website,
    handleEmail,
    handlePhoneCall,
    handleWebsiteClick,
  ]);

  // ✅ maintenant seulement : retours conditionnels (APRES les hooks)
  if (!listing) return null;

  const hasContactInfo = !!(address || phoneNumber || email || website);
  if (!hasContactInfo) return null;

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
        {address && (
          <div className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
            <MapPin className="h-4 w-4 mt-1 text-green-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">Adresse</p>
              <p className="text-sm text-gray-600 leading-relaxed">{address}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(address, "Adresse")}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )}

        {phoneNumber && (
          <>
            <Separator />
            <div className="group flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">Téléphone</p>
                <p className="text-sm text-gray-600">
                  {formatPhoneNumber(phoneNumber)}
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
                  onClick={() => copyToClipboard(phoneNumber, "Numéro")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}

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

        {website && (
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
                  {website}
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
                  onClick={() => copyToClipboard(website, "Site web")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}

        <Separator />

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
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Contact en cours...
            </>
          ) : (
            <>
              <MessageCircle className="h-4 w-4 mr-2" />
              Nous contacter
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          Cliquez sur les icônes pour des actions rapides
        </p>
      </CardContent>
    </Card>
  );
}
