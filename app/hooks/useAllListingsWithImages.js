// hooks/useAllListingsWithImages.js

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/utils/supabase/client";
import { toast } from "sonner";

/**
 * Récupère tous les listings actifs avec leurs images.
 * @returns {{
 *   listings: Array,
 *   isLoading: boolean,
 *   error: string | null,
 *   refetch: () => void
 * }}
 */
export function useAllListingsWithImages() {
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllListings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("listing")
        .select("*, listingImages(id, url)")
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
  }, []);

  useEffect(() => {
    fetchAllListings();
  }, [fetchAllListings]);

  return { listings, isLoading, error, refetch: fetchAllListings };
}
