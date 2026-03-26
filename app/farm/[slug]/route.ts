import { redirect } from "next/navigation";
import { getListing } from "@/lib/data/listings";
import type { NextRequest } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  // Si c'est un ID numérique → redirect 301 vers slug
  if (/^\d+$/.test(slug)) {
    const listing = await getListing(slug);
    if (listing?.slug) {
      redirect(`/farm/${listing.slug}`);
    }
  }
  // Pas un ID numérique et pas trouvé → 404
  redirect("/explorer");
}
