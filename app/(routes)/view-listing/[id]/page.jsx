"use client";
import { supabase } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Slider from "../_components/Slider";
import Details from "../_components/Details";
import { Loader } from "lucide-react";

function ViewListing({ params }) {
  const [listingDetail, setListingDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fonction pour récupérer les détails du listing
    const fetchListingDetail = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("listing")
          .select("*, listingImages(url, listing_id)")
          .eq("id", params.id)
          .eq("active", true)
          .single(); // Utilise single() au lieu de manipuler data[0]

        if (error) {
          console.error("Erreur Supabase:", error);
          setError("La ferme n'a pas pu être chargée. Veuillez réessayer.");
          toast.error("Impossible de charger les détails de la ferme");
        } else if (!data) {
          setError("Cette ferme n'existe pas ou n'est pas active");
        } else {
          setListingDetail(data);
          console.log("Données du listing chargées:", data);
        }
      } catch (err) {
        console.error("Exception:", err);
        setError("Une erreur inattendue s'est produite");
        toast.error("Erreur serveur, veuillez réessayer");
      } finally {
        setLoading(false);
      }
    };

    fetchListingDetail();
  }, [params.id]); // Dépendance à params.id pour rafraîchir si l'id change

  // État de chargement
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Loader className="h-12 w-12 animate-spin text-green-600 mb-4" />
        <p className="text-gray-600 text-lg">
          Chargement des informations de la ferme...
        </p>
      </div>
    );
  }

  // État d'erreur
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-2xl font-bold text-red-700 mb-3">
            Oups ! Un problème est survenu
          </h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Si aucun listing n'est trouvé (normalement capturé par l'erreur, mais par sécurité)
  if (!listingDetail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md">
          <h2 className="text-2xl font-bold text-yellow-700 mb-3">
            Ferme introuvable
          </h2>
          <p className="text-gray-700 mb-4">
            Cette ferme n'existe pas ou n'est plus disponible.
          </p>
          <a
            href="/"
            className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded-md transition-colors inline-block"
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  // Affichage normal du listing
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {listingDetail.name || "Ferme locale"}
      </h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <Slider imageList={listingDetail.listingImages} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <Details listingDetail={listingDetail} />
      </div>
    </div>
  );
}

export default ViewListing;
