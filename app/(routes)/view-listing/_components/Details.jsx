"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Share,
  Leaf,
  Award,
  Clock,
  ShoppingBag,
  CalendarCheck,
  Truck,
  Home,
} from "lucide-react";
import AgentDetail from "./AgentDetail";
import GoogleMapSection from "@/app/modules/maps/components/GoogleMapSection";

function Details({ listingDetail }) {
  if (!listingDetail) {
    return null;
  }

  // Fonction pour formater les listes d'attributs
  const formatList = (list) => {
    if (!list || !Array.isArray(list) || list.length === 0) {
      return "Non spécifié";
    }
    return list.join(", ");
  };

  // Détermine les icônes et le contenu pour les features selon les données disponibles
  const keyFeatures = [
    {
      icon: <Leaf className="h-5 w-5" />,
      label: "Type de produits",
      value: formatList(listingDetail.product_type) || "Non spécifié",
    },
    {
      icon: <Home className="h-5 w-5" />,
      label: "Méthode de production",
      value: formatList(listingDetail.production_method) || "Non spécifié",
    },
    {
      icon: <Award className="h-5 w-5" />,
      label: "Certifications",
      value: formatList(listingDetail.certifications) || "Aucune certification",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      label: "Disponibilité",
      value: formatList(listingDetail.availability) || "Non spécifié",
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      label: "Modes d'achat",
      value: formatList(listingDetail.purchase_mode) || "Non spécifié",
    },
    {
      icon: <CalendarCheck className="h-5 w-5" />,
      label: "Services additionnels",
      value:
        formatList(listingDetail.additional_services) ||
        "Aucun service additionnel",
    },
  ];

  // Fonction pour partager
  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: listingDetail.name || "Ferme locale",
          text: `Découvrez cette ferme: ${listingDetail.name}`,
          url: window.location.href,
        })
        .catch((error) => console.log("Erreur de partage", error));
    } else {
      // Fallback: copier l'URL dans le presse-papier
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert("Lien copié dans le presse-papier!"))
        .catch(() => alert("Impossible de copier le lien"));
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête avec nom, adresse et bouton de partage */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="font-bold text-3xl text-gray-800">
              {listingDetail.name || "Ferme locale"}
            </h1>
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-lg">
                {listingDetail.address || "Adresse non spécifiée"}
              </p>
            </div>
          </div>

          <Button
            onClick={handleShare}
            variant="outline"
            className="flex items-center gap-2 text-gray-600 hover:text-green-600 hover:border-green-600"
          >
            <Share className="h-4 w-4" />
            Partager
          </Button>
        </div>
      </div>

      {/* Caractéristiques clés */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-bold text-2xl text-gray-800 mb-4">
          Caractéristiques clés
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {keyFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-green-100 p-2 rounded-full text-green-600">
                  {feature.icon}
                </div>
                <h3 className="font-medium text-gray-700">{feature.label}</h3>
              </div>
              <p className="text-gray-600 pl-11">{feature.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-bold text-2xl text-gray-800 mb-4">
          À propos de cette ferme
        </h2>
        {listingDetail.description ? (
          <p className="text-gray-600 whitespace-pre-line">
            {listingDetail.description}
          </p>
        ) : (
          <p className="text-gray-500 italic">
            Aucune description disponible pour cette ferme.
          </p>
        )}
      </div>

      {/* Carte */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-bold text-2xl text-gray-800 mb-4">Localisation</h2>
        <div className="rounded-lg overflow-hidden border border-gray-200 h-[400px]">
          {listingDetail.coordinates ? (
            <GoogleMapSection
              coordinates={listingDetail.coordinates}
              listing={[listingDetail]}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <p className="text-gray-500">
                Aucune coordonnée disponible pour cette ferme.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="font-bold text-2xl text-gray-800 mb-4">
          Contact du producteur
        </h2>
        <AgentDetail listingDetail={listingDetail} />
      </div>
    </div>
  );
}

export default Details;
