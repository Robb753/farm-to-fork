import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, User, MessageCircle } from "lucide-react";
import Image from "next/image";
import React from "react";

function AgentDetail({ listingDetail }) {
  if (!listingDetail) {
    return null;
  }

  // Image par défaut si aucune image de profil n'est disponible
  const defaultImage =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";
  const profileImage = listingDetail.profileImage || defaultImage;

  // Nom complet ou email si le nom n'est pas disponible
  const displayName = listingDetail.fullName || "Producteur local";

  // Formater l'email pour l'affichage
  const email = listingDetail.createdBy || "";

  // Gestionnaire pour le bouton de contact
  const handleContactClick = () => {
    // Si un email est disponible, ouvrir le client de messagerie
    if (email) {
      window.location.href = `mailto:${email}?subject=Question sur votre ferme`;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between p-5 rounded-lg shadow-md border border-gray-100 my-6 bg-white hover:shadow-lg transition-shadow">
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
        {/* Image de profil avec fallback et meilleure gestion */}
        <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-green-200 flex-shrink-0">
          <Image
            src={profileImage}
            alt={`Photo de ${displayName}`}
            fill
            sizes="64px"
            className="object-cover"
            onError={(e) => {
              e.target.src = defaultImage;
            }}
          />
        </div>

        {/* Informations du producteur */}
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-1">
            <User className="h-4 w-4 text-green-600" />
            {displayName}
          </h2>

          {email && (
            <div className="text-gray-500 flex items-center gap-1 mt-1">
              <Mail className="h-4 w-4 text-green-600" />
              <span className="truncate max-w-[200px]">{email}</span>
            </div>
          )}

          {listingDetail.phoneNumber && (
            <div className="text-gray-500 flex items-center gap-1 mt-1">
              <Phone className="h-4 w-4 text-green-600" />
              {listingDetail.phoneNumber}
            </div>
          )}

          {listingDetail.address && (
            <div className="text-gray-500 flex items-center gap-1 mt-1 max-w-md">
              <MapPin className="h-4 w-4 text-green-600 flex-shrink-0" />
              <span className="truncate">{listingDetail.address}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bouton de contact */}
      <div className="flex-shrink-0">
        <Button
          onClick={handleContactClick}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 flex items-center gap-2 rounded-md transition-colors"
        >
          <MessageCircle className="h-4 w-4" />
          Contacter
        </Button>
      </div>
    </div>
  );
}

export default AgentDetail;
