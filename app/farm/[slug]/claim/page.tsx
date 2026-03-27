// app/farm/[slug]/claim/page.tsx
// Server Component — gère l'auth et le guard listing avant de rendre ClaimFlow.

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

import { getListingBySlug } from "@/lib/data/listings";
import { ClaimFlow } from "./_components/ClaimFlow";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) return { title: "Ferme introuvable | Farm To Fork" };
  return {
    title: `Revendiquer ${listing.name ?? "la fiche"} | Farm To Fork`,
  };
}

export default async function ClaimFarmPage({ params }: PageProps) {
  const { slug } = await params;

  // Auth — redirige vers sign-in si non connecté
  const { userId } = await auth();
  if (!userId) {
    redirect(`/sign-in?redirect_url=/farm/${slug}/claim`);
  }

  // Récupère le listing
  const listing = await getListingBySlug(slug);

  // Listing inexistant ou sans osm_id (pas éligible)
  if (!listing) notFound();
  if (!listing.osm_id) redirect(`/farm/${slug}`);

  // Listing déjà revendiqué par un autre user
  if (listing.clerk_user_id && listing.clerk_user_id !== userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="text-4xl mb-2">🔒</div>
            <CardTitle>Fiche déjà revendiquée</CardTitle>
            <CardDescription>
              La fiche{" "}
              <strong>{listing.name ?? "cette ferme"}</strong> a déjà été
              revendiquée par un autre utilisateur.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild variant="outline">
              <Link href={`/farm/${slug}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Retour à la fiche
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Listing déjà revendiqué par le même user (retour sur la page)
  if (listing.clerk_user_id === userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 px-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="text-4xl mb-2">✅</div>
            <CardTitle>Vous êtes déjà propriétaire</CardTitle>
            <CardDescription>
              Vous avez déjà revendiqué la fiche{" "}
              <strong>{listing.name ?? "cette ferme"}</strong>.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link href={`/farm/${slug}`}>Voir ma fiche</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 px-4 py-10">
      <div className="max-w-md mx-auto">
        {/* Back link */}
        <Link
          href={`/farm/${slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Voir la fiche ferme
        </Link>

        {/* Card conteneur */}
        <Card className="shadow-sm">
          <CardHeader className="pb-6">
            <CardTitle className="text-lg">
              Revendiquer cette fiche
            </CardTitle>
            <CardDescription>
              Vérifiez votre identité pour devenir propriétaire de la
              fiche{" "}
              <strong className="text-foreground">
                {listing.name ?? "de cette ferme"}
              </strong>
              .
            </CardDescription>
          </CardHeader>

          <CardContent>
            <ClaimFlow
              listing={{
                id: listing.id,
                name: listing.name,
                slug: listing.slug,
                address: listing.address,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
