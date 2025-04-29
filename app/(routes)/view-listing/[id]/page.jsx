// app/(routes)/view-listing/[id]/page.jsx
// Server Component (pas de directive "use client")
import { supabaseServerClient } from "@/utils/supabase/server-client"; // Client Supabase côté serveur
import { notFound } from "next/navigation";
import ViewListing from "./viewlisting";

export default async function ViewListingPage({ params }) {
  // Chargement des données côté serveur
  const { data: listing, error } = await supabaseServerClient
    .from("listing")
    .select("*, listingImages(url, listing_id)")
    .eq("id", params.id)
    .eq("active", true)
    .single();

  // Gestion des erreurs
  if (error || !listing) {
    notFound();
  }

  // Transmission des données au composant client
  return <ViewListing listing={listing} />;
}
