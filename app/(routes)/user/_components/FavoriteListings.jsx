// app/user/_components/FavoriteListings.jsx

"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";

export default function FavoriteListings() {
  const { user } = useUser();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("favorites")
        .eq("user_id", user.id)
        .single();

      const favoriteIds = profile?.favorites || [];

      if (favoriteIds.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      const { data: listings } = await supabase
        .from("listing")
        .select("*, listingImages(url)")
        .in("id", favoriteIds);

      setFavorites(listings || []);
      setLoading(false);
    };

    fetchFavorites();
  }, [user]);

  if (loading) return <p>Chargement des favoris...</p>;

  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">Mes favoris</h2>
      {favorites.length === 0 ? (
        <p className="text-gray-500">Aucune ferme enregistrée en favori.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map((farm) => (
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
