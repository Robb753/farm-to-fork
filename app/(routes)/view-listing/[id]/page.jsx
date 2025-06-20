// view-listing/[id]/page.jsx
import { supabase } from "@/utils/supabase/client";

import ViewListing from "./viewlisting";
import NotFound from "./not-found";
import { notFound } from "next/navigation";

export default async function Page({ params }) {
  const { id } = params;

  if (!id || isNaN(Number(id))) return NotFound();

  const { data, error } = await supabase
    .from("listing")
    .select("*, listingImages(url)")
    .eq("id", id)
    .single();

  if (error || !data) {
    console.error("[Supabase ERROR]", error);
    return notFound();
  }

  return <ViewListing listing={data} />;
}
