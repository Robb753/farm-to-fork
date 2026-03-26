import { redirect } from "next/navigation";
import { getListing } from "@/lib/data/listings";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  // Seulement pour les IDs numériques
  if (/^\d+$/.test(id)) {
    const listing = await getListing(id);
    if (listing?.slug) {
      redirect(`/farm/${listing.slug}`);
    }
  }
  redirect("/explorer");
}
