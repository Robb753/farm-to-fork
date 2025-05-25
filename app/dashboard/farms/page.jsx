"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import {
  BarChart,
  ChevronRight,
  Loader2,
  Plus,
  ShoppingBasket,
  Users,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import AppBarChart from "@/components/AppBarChart";

export default function FarmerDashboard() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isChecking, setIsChecking] = useState(true);
  const [listing, setListing] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({
    views: 0,
    favorites: 0,
    contacts: 0,
    products: 0,
  });
  const router = useRouter();

  useEffect(() => {
    const checkUserAndListing = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        router.push("/sign-in");
        return;
      }

      if (user?.publicMetadata?.role !== "farmer") {
        toast.error("Accès réservé aux producteurs");
        router.push("/");
        return;
      }

      try {
        const email =
          user?.primaryEmailAddress?.emailAddress ||
          user?.emailAddresses[0]?.emailAddress;

        if (email) {
          const { data, error } = await supabase
            .from("listing")
            .select("*, listingImages(url)")
            .eq("createdBy", email)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          setListing(data);

          if (data?.id) {
            const { data: productsData, error: productsError } = await supabase
              .from("products")
              .select("*")
              .eq("listing_id", data.id)
              .order("created_at", { ascending: false });

            if (productsError) throw productsError;
            setProducts(productsData || []);

            setStats({
              views: data.view_count || 0,
              favorites: data.favorite_count || 0,
              contacts: data.contact_count || 0,
              products: productsData?.length || 0,
            });
          }
        }
      } catch (error) {
        console.error("Erreur listing:", error);
        toast.error("Erreur de chargement des données");
      } finally {
        setIsChecking(false);
      }
    };

    checkUserAndListing();
  }, [isLoaded, isSignedIn, user, router]);

  const handleDeleteListing = async () => {
    if (!listing) return;

    const confirmed = window.confirm(
      "Voulez-vous vraiment supprimer cette ferme ? Cette action est irréversible."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const { error: deleteListingError } = await supabase
        .from("listing")
        .delete()
        .eq("id", listing.id);

      if (deleteListingError) throw deleteListingError;

      toast.success("Ferme supprimée avec succès");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      toast.error("Erreur pendant la suppression");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-green-600" />
      </div>
    );
  }

  if (!listing || !listing.coordinates) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-green-800">
            Bienvenue sur votre espace Producteur
          </h1>
          <p className="text-gray-600 mt-3 text-lg">
            Commencez par créer votre première fiche de ferme
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Créer votre ferme</CardTitle>
            <CardDescription>
              Étape 1 : Ajoutez votre ferme pour commencer à vendre vos produits
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="py-5">
              <p className="text-gray-700 mb-6">
                Vous n'avez pas encore de ferme enregistrée. Créez votre fiche
                pour apparaître sur la carte et proposer vos produits.
              </p>

              <div className="border border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-8 aspect-video bg-gray-50">
                <img
                  src="/placeholder.jpg"
                  alt="Placeholder"
                  className="h-24 w-24 opacity-25"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-200 pt-4 flex justify-center">
            <Button asChild className="bg-green-600 hover:bg-green-700">
              <Link href="/add-new-listing" className="flex items-center gap-2">
                <Plus className="w-5 h-5" /> Créer ma ferme
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-800">
          Tableau de bord producteur
        </h1>
        <p className="text-gray-600 mt-2">Gérez votre ferme et vos produits</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Vues"
          value={stats.views}
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          bg="bg-blue-100"
        />
        <StatCard
          label="Produits"
          value={stats.products}
          icon={<ShoppingBasket className="h-5 w-5 text-green-600" />}
          bg="bg-green-100"
        />
        <StatCard
          label="Favoris"
          value={stats.favorites}
          icon={<Users className="h-5 w-5 text-yellow-600" />}
          bg="bg-yellow-100"
        />
        <StatCard
          label="Contacts"
          value={stats.contacts}
          icon={<BarChart className="h-5 w-5 text-purple-600" />}
          bg="bg-purple-100"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ListingCard
          listing={listing}
          onDelete={handleDeleteListing}
          isDeleting={isDeleting}
        />
        <Card className="h-[auto]">
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <AppBarChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, bg }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">{label}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
          <div
            className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
