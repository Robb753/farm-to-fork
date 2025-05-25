"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function RequestFarmerAccessPage() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    farm_name: "",
    location: "",
    phone: "",
    description: "",
    products: "",
    website: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    const userId = user?.id;

    if (
      !email ||
      !formData.farm_name ||
      !formData.location ||
      !formData.description
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      toast.error("Le numéro de téléphone doit contenir 10 chiffres.");
      return;
    }

    setLoading(true);

    try {
      const requestData = {
        user_id: userId,
        email,
        farm_name: formData.farm_name,
        location: formData.location,
        phone: formData.phone,
        description: formData.description,
        products: formData.products,
        website: formData.website,
        status: "pending",
      };

      const { error } = await supabase
        .from("farmer_requests")
        .insert([requestData]);

      if (error) {
        console.error("Erreur Supabase:", error);
        throw new Error(error.message);
      }

      try {
        await fetch("/api/send-admin-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
      } catch (emailError) {
        console.warn("Notification email non envoyée:", emailError);
      }

      toast.success(
        "Demande envoyée avec succès! Nous l'examinerons dans les plus brefs délais."
      );
      router.push("/request-confirmation");
    } catch (err) {
      console.error("Erreur lors de l'envoi:", err);
      toast.error("Erreur lors de l'envoi de la demande: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.farm_name && formData.location && formData.description;
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card className="border-t-4 border-t-green-600 shadow-sm hover:shadow transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-700">
            Demande d'accès producteur
          </CardTitle>
          <CardDescription>
            Parlez-nous de votre ferme pour rejoindre notre communauté de
            producteurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="farm_name" className="font-medium">
                Nom de votre ferme / exploitation *
              </Label>
              <Input
                id="farm_name"
                name="farm_name"
                value={formData.farm_name}
                onChange={handleChange}
                autoComplete="organization"
                required
                placeholder="Ferme du Soleil Levant"
                className="focus-visible:ring-green-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location" className="font-medium">
                Localisation *
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                autoComplete="address-level2"
                required
                placeholder="Ville, département"
                className="focus-visible:ring-green-200"
              />
              <p className="text-sm text-gray-500">
                Région où se situe votre exploitation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="font-medium">
                Téléphone
              </Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="0612345678"
                className="focus-visible:ring-green-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="font-medium">
                Description de votre activité *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                placeholder="Décrivez votre ferme, votre histoire, votre philosophie..."
                className="min-h-[120px] focus-visible:ring-green-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="products" className="font-medium">
                Produits proposés
              </Label>
              <Textarea
                id="products"
                name="products"
                value={formData.products}
                onChange={handleChange}
                placeholder="Légumes de saison, fruits, produits laitiers, viandes..."
                className="min-h-[80px] focus-visible:ring-green-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website" className="font-medium">
                Site web ou page sociale
              </Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                autoComplete="url"
                placeholder="https://www.votresite.fr"
                className="focus-visible:ring-green-200"
              />
            </div>

            <CardFooter className="border-t pt-6">
              <Button
                type="submit"
                disabled={loading || !isFormValid()}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer ma demande"
                )}
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
