// app/user/_components/FavoriteListings.jsx

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
// ✅ Import userStore
import { useUserFavorites, useUserActions } from "@/lib/store/userStore";

export default function FavoriteListings() {
  const { user } = useUser();

  // ✅ Utiliser le store pour les IDs des favoris
  const favoriteIds = useUserFavorites();
  const { loadFavorites } = useUserActions();

  // State local pour les listings complets (avec images, etc.)
  const [favoriteListings, setFavoriteListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Charger les IDs des favoris depuis le store
  useEffect(() => {
    if (user?.id) {
      loadFavorites(user.id);
    }
  }, [user?.id, loadFavorites]);

  // Charger les listings complets depuis Supabase quand les IDs changent
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);

      if (favoriteIds.length === 0) {
        setFavoriteListings([]);
        setLoading(false);
        return;
      }

      const { data: listings } = await supabase
        .from("listing")
        .select("*, listingImages(url)")
        .in("id", favoriteIds);

      setFavoriteListings(listings || []);
      setLoading(false);
    };

    fetchListings();
  }, [favoriteIds]);

  if (loading) return <p>Chargement des favoris...</p>;

  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">Mes favoris</h2>
      {favoriteListings.length === 0 ? (
        <p className="text-gray-500">Aucune ferme enregistrée en favori.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favoriteListings.map((farm) => (
            <div
              key={farm.id}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition"
            >
              <Image
                src={farm?.listingImages?.[0]?.url || "/placeholder.png"}
                width={400}
                height={200}
                className="rounded-md w-full h-[160px] object-cover"
                alt={farm.name}
              />
              <h3 className="font-bold text-lg mt-2">{farm.name}</h3>
              <p className="text-gray-500 text-sm">{farm.address}</p>
              <div className="mt-2 flex gap-2">
                <Link href={`/view-listing/${farm.id}`}>
                  <button className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded">
                    Voir détails
                  </button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
