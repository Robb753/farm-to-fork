export async function generateMetadata({ params }) {
  const { id } = params;

  const { data: listing, error } = await supabaseServerClient
    .from("listing")
    .select("id, name, location, description, listingImages(url)")
    .eq("id", id)
    .eq("active", true)
    .single();

  if (!listing || error) {
    return {
      title: "Ferme introuvable | Farm To Fork",
      description: "Cette ferme n'est pas disponible actuellement.",
    };
  }

  const imageUrl = listing.listingImages?.[0]?.url;

  return {
    title: `${listing.name} | Farm To Fork`,
    description:
      listing.description ||
      `Découvrez les produits de ${listing.name}, ferme locale située à ${
        listing.location || "proximité de chez vous"
      }.`,
    openGraph: {
      title: `${listing.name} | Farm To Fork`,
      description:
        listing.description ||
        `Découvrez les produits de ${listing.name}, ferme locale située à ${
          listing.location || "proximité de chez vous"
        }.`,
      type: "article",
      locale: "fr_FR",
      images: imageUrl
        ? [
            {
              url: imageUrl,
              width: 1200,
              height: 630,
              alt: `Image de ${listing.name}`,
            },
          ]
        : [],
    },
  };
}
