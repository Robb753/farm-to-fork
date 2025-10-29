// Partie client uniquement
"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
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
import { Loader2 } from "@/utils/icons";

export default function RequestFarmerAccessPage() {
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    farm_name: "",
    location: "",
    phone: "",
    description: "",
    products: "",
    website: "",
  });

  const [isDuplicate, setIsDuplicate] = useState(false);

  useEffect(() => {
    const checkIfAlreadySubmitted = async () => {
      if (!isSignedIn) return;

      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;

      const { data, error } = await supabase
        .from("farmer_requests")
        .select("id")
        .eq("email", email)
        .maybeSingle();

      if (data) {
        setIsDuplicate(true);
      }
    };

    checkIfAlreadySubmitted();
  }, [isSignedIn, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const normalizePhoneNumber = (input) => {
    if (!input) return null;
    const raw = input.replace(/\s|-/g, "");
    if (raw.startsWith("+")) return raw;
    if (raw.startsWith("00")) return "+" + raw.slice(2);
    if (raw.startsWith("0")) return "+33" + raw.slice(1);
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error("Veuillez vous connecter pour envoyer votre demande.");
      return;
    }

    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    const userId = user?.id;

    if (
      !email ||
      !userId ||
      !formData.farm_name ||
      !formData.location ||
      !formData.description
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const cleanedPhone = normalizePhoneNumber(formData.phone);

    if (formData.phone && !/^\+?[1-9][0-9]{6,14}$/.test(cleanedPhone)) {
      toast.error("Numéro de téléphone invalide (format attendu : +XX...).");
      return;
    }

    formData.phone = cleanedPhone;
    setLoading(true);

    try {
      const token = await getToken();
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: null,
      });

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
        if (
          error.message.includes("duplicate key") ||
          error.message.includes("farmer_requests_email_key")
        ) {
          toast.warning(
            "Vous avez déjà soumis une demande. Merci de patienter."
          );
          setIsDuplicate(true);
          return;
        }
        throw new Error(error.message);
      }

      await fetch("/api/send-admin-notification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      toast.success("Demande envoyée avec succès !");
      router.push("/request-confirmation");
    } catch (err) {
      console.error("Erreur lors de l'envoi:", err);
      toast.error("Erreur : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () =>
    formData.farm_name && formData.location && formData.description;

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
              <Label htmlFor="farm_name">Nom de votre ferme *</Label>
              <Input
                id="farm_name"
                name="farm_name"
                value={formData.farm_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localisation *</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="products">Produits proposés</Label>
              <Textarea
                id="products"
                name="products"
                value={formData.products}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Site web / page sociale</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />
            </div>

            <CardFooter className="border-t pt-6">
              <Button
                type="submit"
                disabled={loading || !isFormValid() || isDuplicate}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : isDuplicate ? (
                  "Une demande existe déjà"
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
