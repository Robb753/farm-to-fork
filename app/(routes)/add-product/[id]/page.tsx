"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Save, Send } from "@/utils/icons";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/utils/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

/**
 * Interfaces TypeScript pour AddProduct
 */
interface AddProductProps {
  /** Paramètres de route contenant l'ID du listing */
  params: {
    id: string;
  };
  /** Classe CSS personnalisée */
  className?: string;
}

interface ProductFormData {
  title: string;
  category: ProductCategory;
  price: string;
  unit: ProductUnit;
  quantity: string;
  description: string;
  delivery_options: string;
  listingId: string | null;
}

interface ProductData {
  title: string;
  category: ProductCategory;
  price: string;
  unit: ProductUnit;
  quantity: string;
  description: string;
  delivery_options: string;
  listing_id: string;
  created_by: string;
  active: boolean;
  created_at: string;
}

type ProductCategory =
  | "vegetables"
  | "fruits"
  | "dairy"
  | "meat"
  | "eggs"
  | "honey"
  | "other"
  | "";

type ProductUnit = "kg" | "g" | "unit" | "box" | "dozen" | "l" | "ml";

/**
 * Configuration des catégories de produits
 */
const PRODUCT_CATEGORIES: Array<{
  value: ProductCategory;
  label: string;
}> = [
  { value: "vegetables", label: "Légumes" },
  { value: "fruits", label: "Fruits" },
  { value: "dairy", label: "Produits laitiers" },
  { value: "meat", label: "Viande" },
  { value: "eggs", label: "Œufs" },
  { value: "honey", label: "Miel et produits de la ruche" },
  { value: "other", label: "Autre" },
];

/**
 * Configuration des unités de mesure
 */
const PRODUCT_UNITS: Array<{
  value: ProductUnit;
  label: string;
}> = [
  { value: "kg", label: "Kilogramme (kg)" },
  { value: "g", label: "Gramme (g)" },
  { value: "unit", label: "Unité" },
  { value: "box", label: "Caisse" },
  { value: "dozen", label: "Douzaine" },
  { value: "l", label: "Litre (L)" },
  { value: "ml", label: "Millilitre (mL)" },
];

/**
 * Hook pour la gestion du formulaire de produit
 */
const useProductForm = (listingId: string) => {
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    category: "",
    price: "",
    unit: "kg",
    quantity: "",
    description: "",
    delivery_options: "",
    listingId,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const handleSelectChange = useCallback(
    (name: keyof ProductFormData, value: string): void => {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    },
    []
  );

  const isFormValid = useCallback((): boolean => {
    return Boolean(
      formData.title &&
        formData.category &&
        formData.price &&
        formData.unit &&
        formData.quantity &&
        formData.description
    );
  }, [formData]);

  const resetForm = useCallback((): void => {
    setFormData({
      title: "",
      category: "",
      price: "",
      unit: "kg",
      quantity: "",
      description: "",
      delivery_options: "",
      listingId,
    });
  }, [listingId]);

  return {
    formData,
    loading,
    isPublishing,
    setLoading,
    setIsPublishing,
    handleChange,
    handleSelectChange,
    isFormValid,
    resetForm,
  };
};

/**
 * Service pour les opérations Supabase de produits
 */
class ProductService {
  static async createProduct(
    productData: ProductData
  ): Promise<{ id: string }> {
    try {
      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

      if (error) throw error;
      if (!data?.id)
        throw new Error("Aucun ID retourné lors de la création du produit");

      return data;
    } catch (error) {
      console.error("Erreur lors de la création du produit:", error);
      throw error;
    }
  }
}

/**
 * Composant de validation visuelle du formulaire
 */
interface FormValidationProps {
  isValid: boolean;
  requiredFields: string[];
}

const FormValidation: React.FC<FormValidationProps> = ({
  isValid,
  requiredFields,
}) => {
  if (isValid) return null;

  return (
    <div
      className="p-3 border rounded-md text-sm"
      style={{
        backgroundColor: COLORS.WARNING + "10",
        borderColor: COLORS.WARNING + "30",
        color: COLORS.WARNING,
      }}
    >
      <p className="font-medium mb-1">Champs requis manquants :</p>
      <ul className="text-xs space-y-0.5">
        {requiredFields.map((field) => (
          <li key={field}>• {field}</li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Composant AddProduct principal
 *
 * Features:
 * - Formulaire complet de création de produit
 * - Validation stricte avec feedback visuel
 * - Gestion Supabase avec types appropriés
 * - Modes brouillon et publication
 * - Confirmation de publication
 * - Design system cohérent
 * - Loading states optimisés
 * - Gestion d'erreurs contextualisée
 *
 * @param props - Configuration du composant
 * @returns Composant de création de produit
 */
const AddProduct: React.FC<AddProductProps> = ({ params, className = "" }) => {
  const router = useRouter();
  const { user, isLoaded, isSignedIn } = useUser();

  const {
    formData,
    loading,
    isPublishing,
    setLoading,
    setIsPublishing,
    handleChange,
    handleSelectChange,
    isFormValid,
  } = useProductForm(params?.id || "");

  /**
   * Gestion de la soumission du formulaire
   */
  const handleSubmit = useCallback(
    async (
      e: React.FormEvent | React.MouseEvent,
      publish: boolean = false
    ): Promise<void> => {
      e.preventDefault();

      if (!isFormValid()) {
        toast.error("Veuillez remplir tous les champs obligatoires");
        return;
      }

      if (!isSignedIn || !user) {
        toast.error("Vous devez être connecté pour ajouter un produit");
        return;
      }

      setLoading(true);
      setIsPublishing(publish);

      try {
        const userEmail =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress;

        if (!userEmail) {
          throw new Error("Email utilisateur non trouvé");
        }

        if (!params?.id) {
          throw new Error("ID du listing manquant");
        }

        // Préparer les données du produit
        const productData: ProductData = {
          title: formData.title,
          category: formData.category,
          price: formData.price,
          unit: formData.unit,
          quantity: formData.quantity,
          description: formData.description,
          delivery_options: formData.delivery_options,
          listing_id: params.id,
          created_by: userEmail,
          active: publish,
          created_at: new Date().toISOString(),
        };

        // Créer le produit
        await ProductService.createProduct(productData);

        // Messages de succès
        if (publish) {
          toast.success("Produit publié avec succès !");
        } else {
          toast.success("Produit enregistré comme brouillon");
        }

        // Redirection avec délai pour l'UX
        setTimeout(() => {
          router.push("/farmer/products");
        }, 1500);
      } catch (error) {
        console.error("Erreur lors de l'ajout du produit:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        if (errorMessage.includes("permission")) {
          toast.error("Erreur de permissions. Vérifiez vos droits d'accès.");
        } else if (errorMessage.includes("constraint")) {
          toast.error("Erreur de contrainte de base de données.");
        } else if (errorMessage.includes("network")) {
          toast.error(
            "Erreur de connexion. Vérifiez votre connexion Internet."
          );
        } else {
          toast.error(`Erreur lors de l'enregistrement: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
        setIsPublishing(false);
      }
    },
    [
      isFormValid,
      isSignedIn,
      user,
      params?.id,
      formData,
      router,
      setLoading,
      setIsPublishing,
    ]
  );

  // Vérification d'authentification
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div
            className="animate-spin h-12 w-12 rounded-full border-t-2 border-b-2"
            style={{ borderColor: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    router.push("/sign-in");
    return null;
  }

  const requiredFields = [
    !formData.title && "Titre de l'annonce",
    !formData.category && "Catégorie",
    !formData.price && "Prix",
    !formData.quantity && "Quantité disponible",
    !formData.description && "Description du produit",
  ].filter(Boolean) as string[];

  return (
    <div className={cn("container max-w-2xl mx-auto py-12 px-4", className)}>
      <Card
        className="border-t-4 shadow-sm hover:shadow transition-shadow duration-300"
        style={{ borderTopColor: COLORS.PRIMARY }}
      >
        <CardHeader>
          <CardTitle
            className="text-2xl font-bold"
            style={{ color: COLORS.PRIMARY }}
          >
            Ajouter un nouveau produit
          </CardTitle>
          <CardDescription style={{ color: COLORS.TEXT_SECONDARY }}>
            Renseignez les détails de votre produit pour le publier sur la
            plateforme
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form id="productForm" className="space-y-6">
            {/* Titre */}
            <div className="space-y-2">
              <Label
                htmlFor="title"
                className="font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Titre de l'annonce *
              </Label>
              <Input
                id="title"
                placeholder="Ex: Tomates fraîches bio"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            {/* Catégorie */}
            <div className="space-y-2">
              <Label
                htmlFor="category"
                className="font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Catégorie *
              </Label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => handleSelectChange("category", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                style={{
                  borderColor: COLORS.BORDER,
                  color: COLORS.TEXT_PRIMARY,
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = COLORS.PRIMARY;
                  e.target.style.boxShadow = `0 0 0 2px ${COLORS.PRIMARY}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = COLORS.BORDER;
                  e.target.style.boxShadow = "none";
                }}
                required
              >
                <option value="">Sélectionnez une catégorie</option>
                {PRODUCT_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prix, Unité, Quantité */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label
                  htmlFor="price"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Prix *
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2 col-span-1">
                <Label
                  htmlFor="unit"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Unité *
                </Label>
                <select
                  id="unit"
                  name="unit"
                  value={formData.unit}
                  onChange={(e) => handleSelectChange("unit", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{
                    borderColor: COLORS.BORDER,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = COLORS.PRIMARY;
                    e.target.style.boxShadow = `0 0 0 2px ${COLORS.PRIMARY}20`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = COLORS.BORDER;
                    e.target.style.boxShadow = "none";
                  }}
                  required
                >
                  {PRODUCT_UNITS.map((unit) => (
                    <option key={unit.value} value={unit.value}>
                      {unit.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 col-span-1">
                <Label
                  htmlFor="quantity"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Quantité disponible *
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="10"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Description du produit *
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez votre produit en détail (variété, méthode de culture, fraîcheur, etc.)"
                className="min-h-[120px]"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
            </div>

            {/* Options de livraison */}
            <div className="space-y-2">
              <Label
                htmlFor="delivery_options"
                className="font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Options de livraison
              </Label>
              <Textarea
                id="delivery_options"
                placeholder="Ex: Livraison à domicile dans un rayon de 20km, récupération à la ferme le weekend..."
                className="min-h-[80px]"
                name="delivery_options"
                value={formData.delivery_options}
                onChange={handleChange}
              />
              <p className="text-sm mt-1" style={{ color: COLORS.TEXT_MUTED }}>
                Précisez les modalités de livraison ou de récupération
              </p>
            </div>

            {/* Validation du formulaire */}
            <FormValidation
              isValid={isFormValid()}
              requiredFields={requiredFields}
            />
          </form>
        </CardContent>

        <CardFooter
          className="flex justify-between border-t pt-6"
          style={{ borderColor: COLORS.BORDER }}
        >
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center"
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="flex gap-3">
            {/* Bouton Brouillon */}
            <Button
              variant="outline"
              disabled={loading || !isFormValid()}
              onClick={(e) => handleSubmit(e, false)}
              className="flex items-center"
            >
              {loading && !isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>

            {/* Bouton Publier avec confirmation */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={loading || !isFormValid()}
                  className="transition-colors"
                  style={{
                    backgroundColor: COLORS.PRIMARY,
                    color: COLORS.TEXT_WHITE,
                  }}
                  onMouseEnter={(e) => {
                    if (!loading && isFormValid()) {
                      e.currentTarget.style.backgroundColor =
                        COLORS.PRIMARY_DARK;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isFormValid()) {
                      e.currentTarget.style.backgroundColor = COLORS.PRIMARY;
                    }
                  }}
                >
                  {loading && isPublishing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Publier
                </Button>
              </AlertDialogTrigger>

              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publier ce produit ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Une fois publié, votre produit sera visible par tous les
                    utilisateurs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => handleSubmit(e, true)}
                    className="transition-colors"
                    style={{
                      backgroundColor: COLORS.PRIMARY,
                      color: COLORS.TEXT_WHITE,
                    }}
                  >
                    Confirmer et publier
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AddProduct;

/**
 * Export des types pour utilisation externe
 */
export type { AddProductProps, ProductFormData, ProductCategory, ProductUnit };
