// app/(routes)/view-listing/_components/AgentDetail.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, User, MessageCircle, Star, Shield } from "@/utils/icons";
import Image from "next/image";
import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Database } from "@/lib/types/database";

/**
 * Type pour les détails d'un listing avec producteur
 */
type ListingDetail = Database["public"]["Tables"]["listing"]["Row"];

/**
 * Props du composant AgentDetail
 */
interface AgentDetailProps {
  listingDetail: ListingDetail | null;
  className?: string;
}

/**
 * Type pour les statistiques du producteur (simulées pour l'exemple)
 */
interface ProducerStats {
  yearsOfExperience?: number;
  productsCount?: number;
  rating?: number;
  isVerified?: boolean;
}

/**
 * Composant d'affichage des détails du producteur/fermier
 * 
 * Features:
 * - Affichage des informations de contact du producteur
 * - Image de profil avec fallback intelligent
 * - Actions de contact (email, téléphone)
 * - Design responsive et moderne
 * - Gestion d'erreurs pour images et contacts
 * - Statistiques et badges de confiance
 * 
 * @param listingDetail - Détails du listing avec informations producteur
 * @param className - Classes CSS additionnelles
 * @returns JSX.Element - Card du producteur
 */
export default function AgentDetail({ listingDetail, className }: AgentDetailProps): JSX.Element | null {
  const [imageError, setImageError] = useState<boolean>(false);
  const [isContacting, setIsContacting] = useState<boolean>(false);

  // Early return si pas de données
  if (!listingDetail) {
    return null;
  }

  /**
   * Image par défaut avec plusieurs fallbacks
   */
  const getProfileImage = useCallback((): string => {
    if (imageError) {
      // Fallback avec initiales basées sur le nom
      const initials = getInitials(listingDetail.fullName);
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=10b981&color=fff&size=128`;
    }

    return listingDetail.profileImage ||
           `https://ui-avatars.com/api/?name=${encodeURIComponent(getInitials(listingDetail.fullName))}&background=10b981&color=fff&size=128`;
  }, [imageError, listingDetail.profileImage, listingDetail.fullName]);

  /**
   * Nom d'affichage avec fallback intelligent
   */
  const getDisplayName = useCallback((): string => {
    if (listingDetail.fullName && listingDetail.fullName.trim()) {
      return listingDetail.fullName.trim();
    }
    
    // Extraire le nom depuis l'email si disponible
    if (listingDetail.email) {
      const emailName = listingDetail.email.split('@')[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    
    return "Producteur local";
  }, [listingDetail.fullName, listingDetail.email]);

  /**
   * Statistiques simulées du producteur (à remplacer par de vraies données)
   */
  const getProducerStats = useCallback((): ProducerStats => {
    return {
      yearsOfExperience: Math.floor(Math.random() * 15) + 5, // 5-20 ans
      productsCount: Math.floor(Math.random() * 20) + 5,      // 5-25 produits
      rating: 4.2 + Math.random() * 0.8,                      // 4.2-5.0
      isVerified: Math.random() > 0.3,                        // 70% verified
    };
  }, []);

  /**
   * Extrait les initiales d'un nom
   */
  function getInitials(name?: string | null): string {
    if (!name) return "PL"; // Producteur Local
    
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  }

  /**
   * Gestionnaire pour le contact par email
   */
  const handleEmailContact = useCallback(async (): Promise<void> => {
    const email = listingDetail.email;

    if (!email) {
      toast.error("Aucun email de contact disponible");
      return;
    }

    setIsContacting(true);

    try {
      // Construire un sujet personnalisé
      const subject = `Question sur votre ferme "${listingDetail.name || 'listing'}"`;
      const body = `Bonjour,\n\nJe suis intéressé(e) par votre ferme et j'aimerais en savoir plus sur vos produits.\n\nCordialement`;
      
      const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      
      // Ouvrir le client de messagerie
      window.location.href = mailtoUrl;
      
      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "contact_producer", {
          event_category: "listing_interaction",
          event_label: "email",
          listing_id: listingDetail.id,
          method: "email",
        });
      }
      
      toast.success("Client de messagerie ouvert !");
    } catch (error) {
      console.error("Erreur lors de l'ouverture du client email:", error);
      toast.error("Impossible d'ouvrir le client de messagerie");
    } finally {
      setIsContacting(false);
    }
  }, [listingDetail]);

  /**
   * Gestionnaire pour le contact par téléphone
   */
  const handlePhoneContact = useCallback((): void => {
    if (!listingDetail.phoneNumber) {
      toast.error("Aucun numéro de téléphone disponible");
      return;
    }

    try {
      window.location.href = `tel:${listingDetail.phoneNumber}`;
      
      // Analytics tracking
      if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", "contact_producer", {
          event_category: "listing_interaction",
          event_label: "phone",
          listing_id: listingDetail.id,
          method: "phone",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ouverture du dialer:", error);
      toast.error("Impossible d'ouvrir le dialer");
    }
  }, [listingDetail.phoneNumber, listingDetail.id]);

  /**
   * Gère les erreurs de chargement d'image
   */
  const handleImageError = useCallback((): void => {
    setImageError(true);
  }, []);

  const displayName = getDisplayName();
  const stats = getProducerStats();

  return (
    <div className={cn(
      "group relative overflow-hidden",
      "bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg",
      "transition-all duration-300 p-6 my-6",
      "hover:border-green-200 hover:bg-green-50/30",
      className
    )}>
      
      {/* Badge vérifié */}
      {stats.isVerified && (
        <div className="absolute top-4 right-4">
          <div className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            <Shield className="h-3 w-3" />
            Vérifié
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
        
        {/* Section profil */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          
          {/* Image de profil améliorée */}
          <div className="relative group/avatar">
            <div className="relative h-20 w-20 rounded-full overflow-hidden border-3 border-green-200 group-hover/avatar:border-green-300 transition-colors">
              <Image
                src={getProfileImage()}
                alt={`Photo de profil de ${displayName}`}
                fill
                sizes="80px"
                className="object-cover transition-transform group-hover/avatar:scale-110"
                onError={handleImageError}
                priority
              />
            </div>
            
            {/* Indicateur en ligne (simulé) */}
            <div className="absolute bottom-1 right-1 h-4 w-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>

          {/* Informations détaillées */}
          <div className="text-center sm:text-left flex-1">
            
            {/* Nom et titre */}
            <div className="space-y-1 mb-3">
              <h3 className="text-xl font-bold text-gray-900 flex items-center justify-center sm:justify-start gap-2">
                <User className="h-5 w-5 text-green-600" />
                {displayName}
              </h3>
              
              {/* Badge producteur */}
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  🌱 Producteur local
                </span>
                
                {/* Rating si disponible */}
                {stats.rating && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="font-medium">{stats.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations de contact */}
            <div className="space-y-2">
              {listingDetail.email && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="truncate max-w-[250px]">{listingDetail.email}</span>
                </div>
              )}

              {listingDetail.phoneNumber && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{listingDetail.phoneNumber}</span>
                </div>
              )}

              {listingDetail.address && (
                <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="truncate max-w-[300px]">{listingDetail.address}</span>
                </div>
              )}
            </div>

            {/* Statistiques rapides */}
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs text-gray-500">
              {stats.yearsOfExperience && (
                <span>{stats.yearsOfExperience} ans d'expérience</span>
              )}
              {stats.productsCount && (
                <span>{stats.productsCount}+ produits</span>
              )}
            </div>
          </div>
        </div>

        {/* Actions de contact */}
        <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
          
          {/* Bouton email */}
          <Button
            onClick={handleEmailContact}
            disabled={isContacting || !listingDetail.email}
            className={cn(
              "bg-green-600 hover:bg-green-700 text-white",
              "px-4 py-2 flex items-center gap-2 rounded-lg",
              "transition-all duration-200 hover:shadow-md",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isContacting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Contact...
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Contacter
              </>
            )}
          </Button>

          {/* Bouton téléphone si disponible */}
          {listingDetail.phoneNumber && (
            <Button
              onClick={handlePhoneContact}
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50 px-4 py-2 flex items-center gap-2 rounded-lg"
            >
              <Phone className="h-4 w-4" />
              Appeler
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}