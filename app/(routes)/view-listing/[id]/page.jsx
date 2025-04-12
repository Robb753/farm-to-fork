"use client";
import { supabase } from "@/utils/supabase/client";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Slider from "../_components/Slider";
import Details from "../_components/Details";
import { Loader } from "lucide-react";
import { useRouter } from "next/navigation";

function ViewListing({ params }) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from("listing")
          .select("*, listingImages(url, listing_id)")
          .eq("id", params.id)
          .eq("active", true)
          .single();

        if (error) {
          toast.error("Impossible de charger les détails de la ferme");
          setError("Cette ferme n'existe pas ou n'est pas disponible.");
          return;
        }

        if (!data) {
          setError("Aucune donnée disponible.");
          return;
        }

        setListing(data);
      } catch (err) {
        toast.error("Erreur serveur inattendue.");
        setError("Une erreur est survenue, veuillez réessayer.");
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-4">
        <Loader className="h-12 w-12 animate-spin text-green-600 mb-4" />
        <p className="text-gray-600 text-lg">Chargement de la ferme...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="bg-red-100 border border-red-300 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-700 mb-3">
            Une erreur est survenue
          </h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => router.refresh()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        {listing?.name || "Ferme locale"}
      </h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <Slider imageList={listing.listingImages} />
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <Details listingDetail={listing} />
      </div>
    </div>
  );
}

export default ViewListing;
