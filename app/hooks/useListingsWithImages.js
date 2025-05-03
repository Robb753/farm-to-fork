import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

/**
 * Récupère les listings actifs avec leurs images associées.
 * @param {Array<number>} listingIds - Liste des IDs à récupérer.
 */
export function useListingsWithImages(listingIds = []) {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchListings = useCallback(async () => {
    if (!listingIds || listingIds.length === 0) {
      setListings([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("listing")
        .select("*, listingImages(id, url)")
        .in("id", listingIds)
        .eq("active", true);

      if (error) throw error;

      setListings(data || []);
    } catch (err) {
      console.error("Erreur Supabase:", err);
      setError(err.message || "Erreur inconnue");
      toast.error("Erreur lors du chargement des listings.");
    } finally {
      setIsLoading(false);
    }
  }, [JSON.stringify(listingIds)]); // ← éviter dépendance circulaire avec listingIds

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  return { listings, isLoading, error, refetch: fetchListings };
}
