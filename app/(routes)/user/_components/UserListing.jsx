import { Button } from "@/components/ui/button";
import { supabase } from "@/utils/supabase/client";
import { useUser } from "@clerk/nextjs";
import { BathIcon, BedDouble, MapPin, RulerIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";

function UserListing() {
  const { user } = useUser();
  const [listing, setListing] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      GetUserListing();
    }
  }, [user]);

  const GetUserListing = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("listing")
      .select(`*, listingImages(url, listing_id)`)
      .eq("createdBy", user?.primaryEmailAddress.emailAddress);

    if (!error) {
      setListing(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this listing?"
    );
    if (!confirmDelete) return;

    const { error } = await supabase.from("listing").delete().eq("id", id);

    if (!error) {
      setListing(listing.filter((item) => item.id !== id)); // Supprime localement
    }
  };

  return (
    <div>
      <h2 className="font-bold text-2xl mb-4">Manage your Listings</h2>

      {/* Affichage du message de chargement */}
      {loading && <p className="text-gray-500">Loading your listings...</p>}

      {/* Affichage si aucun listing n'est trouvé */}
      {!loading && listing.length === 0 && (
        <p className="text-gray-500">You have no listings yet.</p>
      )}

      {/* Affichage des listings une fois chargés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {!loading &&
          listing.map((item, index) => (
            <div
              key={item.id}
              className="p-3 hover:border hover:border-primary rounded-lg relative gap-3 bg-white shadow-md"
            >
              <h2 className="bg-primary m-1 text-white px-2 text-sm p-1 rounded-md absolute">
                {item.active ? "Published" : "Draft"}
              </h2>
              <Image
                src={
                  item?.listingImages[0]
                    ? item?.listingImages[0]?.url
                    : "/placeholder.png"
                }
                width={800}
                height={150}
                className="rounded-lg object-cover h-[170px] w-full"
                alt={`Listing image ${index}`}
                priority
              />

              <div className="flex mt-2 flex-col gap-2 overflow-hidden">
                <h2 className="font-bold text-xl">{item?.name}</h2>
                <h2 className="flex gap-2 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 text-gray-800" />
                  {item?.address}
                </h2>
                <div className="flex mt-2 gap-2 justify-between">
                  <h2 className="flex gap-2 text-sm bg-slate-100 rounded-md p-2 text-gray-600 justify-center items-center">
                    <BedDouble className="h-4 w-4" />
                    {item?.product_type}
                  </h2>
                  <h2 className="flex gap-2 text-sm bg-slate-100 rounded-md p-2 text-gray-600 justify-center items-center">
                    <BathIcon className="h-4 w-4" />
                    {item?.certification}
                  </h2>
                  <h2 className="flex gap-2 text-sm bg-slate-100 rounded-md p-2 text-gray-600 justify-center items-center">
                    <RulerIcon className="h-4 w-4" />
                    {item?.purchase_mode}
                  </h2>
                </div>
                <div className="flex gap-2 justify-between">
                  <Link href={"/view-listing/" + item.id}>
                    <Button size="sm" variant="default" className="w-full">
                      View
                    </Button>
                  </Link>
                  <Link href={"/edit-listing/" + item.id}>
                    <Button size="sm" variant="default" className="w-full">
                      Edit
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default UserListing;
