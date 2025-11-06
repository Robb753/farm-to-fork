"use client";

import { useState, useEffect, FormEvent, ChangeEvent } from "react";
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
import { COLORS, PATHS, FARMER_REQUESTS_COLUMNS, FARMER_REQUEST_STATUS } from "@/lib/config";
import { cn } from "@/lib/utils";

/**
 * Interface pour les données du formulaire de demande producteur
 */
interface FarmerRequestFormData {
  farm_name: string;
  location: string;
  phone: string;
  description: string;
  products: string;
  website: string;
}

/**
 * Page de demande d'accès producteur
 * 
 * Features:
 * - Formulaire complet avec validation
 * - Vérification des doublons
 * - Normalisation du numéro de téléphone
 * - Envoi de notification admin
 * - Intégration avec la configuration centralisée
 */
export default function RequestFarmerAccessPage(): JSX.Element {
  const { user } = useUser();
  const { getToken, isSignedIn } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [isDuplicate, setIsDuplicate] = useState<boolean>(false);

  const [formData, setFormData] = useState<FarmerRequestFormData>({
    farm_name: "",
    location: "",
    phone: "",
    description: "",
    products: "",
    website: "",
  });

  /**
   * Vérifier si l'utilisateur a déjà soumis une demande
   */
  useEffect(() => {
    const checkIfAlreadySubmitted = async (): Promise<void> => {
      if (!isSignedIn || !user) return;

      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;

      if (!email) return;

      try {
        const { data, error } = await supabase
          .from("farmer_requests")
          .select("id")
          .eq(FARMER_REQUESTS_COLUMNS.EMAIL, email)
          .maybeSingle();

        if (error && error.code !== "PGRST116") {
          console.error("Erreur lors de la vérification:", error);
          return;
        }

        if (data) {
          setIsDuplicate(true);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification des doublons:", error);
      }
    };

    checkIfAlreadySubmitted();
  }, [isSignedIn, user]);

  /**
   * Gérer les changements dans le formulaire
   */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Normaliser le numéro de téléphone au format international
   */
  const normalizePhoneNumber = (input: string): string | null => {
    if (!input) return null;
    
    const raw = input.replace(/\s|-/g, "");
    
    if (raw.startsWith("+")) return raw;
    if (raw.startsWith("00")) return "+" + raw.slice(2);
    if (raw.startsWith("0")) return "+33" + raw.slice(1);
    
    return null;
  };

  /**
   * Valider le formulaire
   */
  const isFormValid = (): boolean => {
    return Boolean(
      formData.farm_name.trim() && 
      formData.location.trim() && 
      formData.description.trim()
    );
  };

  /**
   * Gérer la soumission du formulaire
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error("Veuillez vous connecter pour envoyer votre demande.");
      return;
    }

    const email =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    const userId = user?.id;

    if (!email || !userId || !isFormValid()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    // Validation du téléphone si fourni
    const cleanedPhone = formData.phone ? normalizePhoneNumber(formData.phone) : null;

    if (formData.phone && cleanedPhone && !/^\+?[1-9][0-9]{6,14}$/.test(cleanedPhone)) {
      toast.error("Numéro de téléphone invalide (format attendu : +XX...).");
      return;
    }

    setLoading(true);

    try {
      // Authentification avec Supabase
      const token = await getToken();
      if (token) {
        await supabase.auth.setSession({
          access_token: token,
          refresh_token: null,
        });
      }

      // Préparer les données de la demande
      const requestData = {
        [FARMER_REQUESTS_COLUMNS.USER_ID]: userId,
        [FARMER_REQUESTS_COLUMNS.EMAIL]: email,
        [FARMER_REQUESTS_COLUMNS.FARM_NAME]: formData.farm_name.trim(),
        [FARMER_REQUESTS_COLUMNS.LOCATION]: formData.location.trim(),
        [FARMER_REQUESTS_COLUMNS.PHONE]: cleanedPhone,
        [FARMER_REQUESTS_COLUMNS.DESCRIPTION]: formData.description.trim(),
        [FARMER_REQUESTS_COLUMNS.PRODUCTS]: formData.products.trim() || null,
        [FARMER_REQUESTS_COLUMNS.WEBSITE]: formData.website.trim() || null,
        [FARMER_REQUESTS_COLUMNS.STATUS]: FARMER_REQUEST_STATUS.PENDING,
      };

      // Insérer dans la base de données
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

      // Envoyer la notification admin
      try {
        await fetch("/api/send-admin-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
      } catch (notificationError) {
        console.warn("Erreur lors de l'envoi de la notification admin:", notificationError);
        // Ne pas faire échouer la demande si la notification échoue
      }

      toast.success("Demande envoyée avec succès !");
      setHasSubmitted(true);
      router.push(PATHS.REQUEST_CONFIRMATION || "/request-confirmation");
    } catch (err) {
      console.error("Erreur lors de l'envoi:", err);
      const errorMessage = err instanceof Error ? err.message : "Erreur inconnue";
      toast.error(`Erreur : ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <Card 
        className={cn(
          "border-t-4 shadow-sm transition-shadow duration-300",
          "hover:shadow-md"
        )}
        style={{ borderTopColor: COLORS.PRIMARY }}
      >
        <CardHeader>
          <CardTitle 
            className="text-2xl font-bold"
            style={{ color: COLORS.PRIMARY }}
          >
            Demande d'accès producteur
          </CardTitle>
          <CardDescription style={{ color: COLORS.TEXT_SECONDARY }}>
            Parlez-nous de votre ferme pour rejoindre notre communauté de
            producteurs
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nom de la ferme */}
            <div className="space-y-2">
              <Label 
                htmlFor="farm_name"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Nom de votre ferme *
              </Label>
              <Input
                id="farm_name"
                name="farm_name"
                value={formData.farm_name}
                onChange={handleChange}
                required
                className="transition-colors duration-200"
                placeholder="Ex: Ferme du Soleil Vert"
              />
            </div>

            {/* Localisation */}
            <div className="space-y-2">
              <Label 
                htmlFor="location"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Localisation *
              </Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                className="transition-colors duration-200"
                placeholder="Ex: Lyon, Rhône-Alpes"
              />
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label 
                htmlFor="phone"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Téléphone
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="transition-colors duration-200"
                placeholder="Ex: +33 6 12 34 56 78"
              />
              <p 
                className="text-sm"
                style={{ color: COLORS.TEXT_MUTED }}
              >
                Format international recommandé (+33...)
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label 
                htmlFor="description"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Description de votre ferme *
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                className="transition-colors duration-200 min-h-[100px]"
                placeholder="Décrivez votre ferme, vos méthodes de production, votre histoire..."
              />
            </div>

            {/* Produits */}
            <div className="space-y-2">
              <Label 
                htmlFor="products"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Produits proposés
              </Label>
              <Textarea
                id="products"
                name="products"
                value={formData.products}
                onChange={handleChange}
                className="transition-colors duration-200"
                placeholder="Ex: Légumes de saison, œufs fermiers, miel..."
              />
            </div>

            {/* Site web */}
            <div className="space-y-2">
              <Label 
                htmlFor="website"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Site web / page sociale
              </Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleChange}
                className="transition-colors duration-200"
                placeholder="Ex: https://www.maferme.fr"
              />
            </div>

            {/* Message d'information */}
            <div 
              className="p-4 rounded-lg border text-sm"
              style={{
                backgroundColor: COLORS.PRIMARY_BG,
                borderColor: `${COLORS.PRIMARY}30`,
                color: COLORS.PRIMARY_DARK,
              }}
            >
              <p className="font-medium mb-1">📋 Processus de validation</p>
              <p>
                Notre équipe examinera votre demande sous 1-2 jours ouvrés. 
                Vous recevrez un email de confirmation une fois approuvée.
              </p>
            </div>
          </form>
        </CardContent>

        <CardFooter className="border-t pt-6">
          <Button
            type="submit"
            disabled={loading || !isFormValid() || isDuplicate}
            className={cn(
              "w-full transition-all duration-200",
              "hover:shadow-md focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            )}
            style={{
              backgroundColor: isDuplicate 
                ? COLORS.TEXT_MUTED 
                : COLORS.PRIMARY,
              color: COLORS.BG_WHITE,
            }}
            onClick={handleSubmit as any}
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
      </Card>

      {/* Section aide */}
      {!isDuplicate && (
        <div className="mt-6 text-center">
          <p 
            className="text-sm mb-2"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            Des questions avant de commencer ?
          </p>
          <a 
            href="/contact"
            className={cn(
              "text-sm font-medium underline transition-colors duration-200",
              "hover:no-underline focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded px-1"
            )}
            style={{ color: COLORS.PRIMARY }}
          >
            Contactez notre équipe
          </a>
        </div>
      )}
    </div>
  );
}