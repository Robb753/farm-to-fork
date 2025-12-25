"use client";

import React, { useState, useCallback, useEffect } from "react";
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
import { COLORS } from "@/lib/config";
import type { ProductInsert } from "@/lib/types/database";

// ==================== DONNÉES PRODUITS RÉELLES ====================

const VEGETABLES_DATA = [
  { name: "Carotte", category: "racine", type: "légume", labels: [] },
  { name: "Betterave rouge", category: "racine", type: "légume", labels: [] },
  { name: "Radis rose", category: "racine", type: "légume", labels: [] },
  { name: "Radis noir", category: "racine", type: "légume", labels: [] },
  { name: "Panais", category: "racine", type: "légume", labels: [] },
  { name: "Topinambour", category: "racine", type: "légume", labels: [] },
  { name: "Navet", category: "racine", type: "légume", labels: [] },
  { name: "Rutabaga", category: "racine", type: "légume", labels: [] },

  { name: "Oignon jaune", category: "bulbe", type: "légume", labels: [] },
  { name: "Oignon rouge", category: "bulbe", type: "légume", labels: [] },
  { name: "Échalote", category: "bulbe", type: "légume", labels: [] },
  { name: "Ail", category: "bulbe", type: "légume", labels: [] },
  { name: "Poireau", category: "bulbe", type: "légume", labels: [] },

  { name: "Laitue", category: "feuille", type: "légume", labels: [] },
  { name: "Épinard", category: "feuille", type: "légume", labels: [] },
  { name: "Mâche", category: "feuille", type: "légume", labels: [] },
  { name: "Roquette", category: "feuille", type: "légume", labels: [] },
  { name: "Chou kale", category: "feuille", type: "légume", labels: [] },

  { name: "Tomate", category: "fruit", type: "légume", labels: [] },
  { name: "Courgette", category: "fruit", type: "légume", labels: [] },
  { name: "Aubergine", category: "fruit", type: "légume", labels: [] },
  { name: "Poivron", category: "fruit", type: "légume", labels: [] },
  { name: "Concombre", category: "fruit", type: "légume", labels: [] },
];

const FRUITS_DATA = [
  { name: "Pomme", category: "à pépins", type: "fruit", labels: [] },
  { name: "Poire", category: "à pépins", type: "fruit", labels: [] },
  { name: "Coing", category: "à pépins", type: "fruit", labels: [] },

  { name: "Cerise", category: "à noyau", type: "fruit", labels: [] },
  { name: "Prune", category: "à noyau", type: "fruit", labels: [] },
  { name: "Pêche", category: "à noyau", type: "fruit", labels: [] },
  { name: "Abricot", category: "à noyau", type: "fruit", labels: [] },

  { name: "Fraise", category: "petit fruit", type: "fruit", labels: [] },
  { name: "Framboise", category: "petit fruit", type: "fruit", labels: [] },
  { name: "Groseille", category: "petit fruit", type: "fruit", labels: [] },
  { name: "Cassis", category: "petit fruit", type: "fruit", labels: [] },
  { name: "Myrtille", category: "petit fruit", type: "fruit", labels: [] },

  { name: "Noix", category: "fruit sec", type: "fruit", labels: [] },
  { name: "Noisette", category: "fruit sec", type: "fruit", labels: [] },
  { name: "Châtaigne", category: "fruit sec", type: "fruit", labels: [] },
];

const DAIRY_DATA = [
  {
    name: "Lait cru de vache",
    category: "lait",
    type: "produit laitier",
    labels: [],
  },
  {
    name: "Lait cru de chèvre",
    category: "lait",
    type: "produit laitier",
    labels: ["fermier"],
  },
  {
    name: "Lait cru de brebis",
    category: "lait",
    type: "produit laitier",
    labels: ["fermier"],
  },

  {
    name: "Yaourt nature",
    category: "yaourt",
    type: "produit laitier",
    labels: [],
  },
  {
    name: "Yaourt de chèvre",
    category: "yaourt",
    type: "produit laitier",
    labels: ["fermier"],
  },
  {
    name: "Yaourt aux fruits",
    category: "yaourt",
    type: "produit laitier",
    labels: [],
  },

  {
    name: "Fromage de chèvre frais",
    category: "fromage de chèvre",
    type: "produit laitier",
    labels: ["fermier"],
  },
  {
    name: "Fromage de chèvre affiné",
    category: "fromage de chèvre",
    type: "produit laitier",
    labels: ["fermier"],
  },
  {
    name: "Comté",
    category: "fromage AOP",
    type: "produit laitier",
    labels: ["AOP"],
  },
  {
    name: "Roquefort",
    category: "fromage AOP",
    type: "produit laitier",
    labels: ["AOP"],
  },

  {
    name: "Beurre doux",
    category: "beurre",
    type: "produit laitier",
    labels: [],
  },
  {
    name: "Beurre demi-sel",
    category: "beurre",
    type: "produit laitier",
    labels: [],
  },
  {
    name: "Crème fraîche",
    category: "crème",
    type: "produit laitier",
    labels: [],
  },
];

const PRODUCT_CATEGORIES = [
  {
    value: "vegetables",
    label: "Légumes",
    data: VEGETABLES_DATA,
    subcategories: [
      "racine",
      "bulbe",
      "feuille",
      "fruit",
      "tubercule",
      "légumineuse",
      "inflorescence",
      "tige",
    ],
  },
  {
    value: "fruits",
    label: "Fruits",
    data: FRUITS_DATA,
    subcategories: [
      "à pépins",
      "à noyau",
      "petit fruit",
      "fruit sec",
      "méditerranéen",
      "exotique acclimaté",
      "agrume",
    ],
  },
  {
    value: "dairy",
    label: "Produits laitiers",
    data: DAIRY_DATA,
    subcategories: [
      "lait",
      "yaourt",
      "fromage de chèvre",
      "fromage AOP",
      "fromage affiné",
      "beurre",
      "crème",
      "fromage frais",
    ],
  },
  {
    value: "meat",
    label: "Viande",
    data: [
      {
        name: "Bœuf de race",
        category: "bœuf",
        type: "viande",
        labels: ["fermier"],
      },
      {
        name: "Porc fermier",
        category: "porc",
        type: "viande",
        labels: ["fermier"],
      },
      {
        name: "Volaille fermière",
        category: "volaille",
        type: "viande",
        labels: ["fermier"],
      },
      {
        name: "Agneau",
        category: "agneau",
        type: "viande",
        labels: ["fermier"],
      },
    ],
    subcategories: ["bœuf", "porc", "volaille", "agneau", "gibier"],
  },
  {
    value: "eggs",
    label: "Œufs",
    data: [
      {
        name: "Œufs de poule fermiers",
        category: "œufs de poule",
        type: "œuf",
        labels: ["fermier"],
      },
      {
        name: "Œufs de canard",
        category: "œufs de canard",
        type: "œuf",
        labels: ["fermier"],
      },
      {
        name: "Œufs d'oie",
        category: "œufs d'oie",
        type: "œuf",
        labels: ["fermier"],
      },
    ],
    subcategories: ["œufs de poule", "œufs de canard", "œufs d'oie"],
  },
  {
    value: "honey",
    label: "Miel et produits de la ruche",
    data: [
      {
        name: "Miel de fleurs",
        category: "miel",
        type: "produit de la ruche",
        labels: ["apiculteur"],
      },
      {
        name: "Miel d'acacia",
        category: "miel",
        type: "produit de la ruche",
        labels: ["apiculteur"],
      },
      {
        name: "Propolis",
        category: "autre",
        type: "produit de la ruche",
        labels: ["apiculteur"],
      },
      {
        name: "Gelée royale",
        category: "autre",
        type: "produit de la ruche",
        labels: ["apiculteur"],
      },
    ],
    subcategories: ["miel", "autre"],
  },
];

const PRODUCT_UNITS = [
  { value: "kg", label: "Kilogramme (kg)" },
  { value: "g", label: "Gramme (g)" },
  { value: "unit", label: "Unité" },
  { value: "box", label: "Caisse/Barquette" },
  { value: "dozen", label: "Douzaine" },
  { value: "l", label: "Litre (L)" },
  { value: "ml", label: "Millilitre (mL)" },
  { value: "bunch", label: "Botte" },
  { value: "basket", label: "Panier" },
];

// ==================== TYPES ====================

interface PageProps {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

interface ProductFormData {
  selectedProduct: string;
  customName: string;
  category: string;
  subcategory: string;
  price: string;
  unit: string;
  quantity: string;
  description: string;
  delivery_options: string;
}

type ProductUnit =
  | "kg"
  | "g"
  | "unit"
  | "box"
  | "dozen"
  | "l"
  | "ml"
  | "bunch"
  | "basket";

// ==================== HOOK ====================

const useProductForm = () => {
  const [formData, setFormData] = useState<ProductFormData>({
    selectedProduct: "",
    customName: "",
    category: "",
    subcategory: "",
    price: "",
    unit: "kg",
    quantity: "",
    description: "",
    delivery_options: "",
  });

  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSelectChange = useCallback(
    (name: keyof ProductFormData, value: string) => {
      setFormData((prev) => {
        const newData: ProductFormData = { ...prev, [name]: value };

        if (name === "category") {
          newData.subcategory = "";
          newData.selectedProduct = "";
          newData.customName = "";
        }

        if (name === "subcategory") {
          newData.selectedProduct = "";
          newData.customName = "";
        }

        return newData;
      });
    },
    []
  );

  const getProductName = useCallback((): string => {
    if (formData.selectedProduct === "custom") {
      return formData.customName.trim();
    }
    return formData.selectedProduct.trim();
  }, [formData.selectedProduct, formData.customName]);

  const isFormValid = useCallback((): boolean => {
    const productName = getProductName();
    return Boolean(
      productName &&
        formData.category &&
        formData.subcategory &&
        formData.price &&
        formData.unit &&
        formData.quantity &&
        formData.description
    );
  }, [formData, getProductName]);

  return {
    formData,
    loading,
    isPublishing,
    setLoading,
    setIsPublishing,
    handleChange,
    handleSelectChange,
    getProductName,
    isFormValid,
  };
};

// ==================== SERVICE ====================

class ProductService {
  static async createProduct(
    productData: ProductInsert
  ): Promise<{ id: number }> {
    const { data, error } = await supabase
      .from("products")
      .insert(productData)
      .select("id")
      .single();

    if (error) throw error;
    if (!data?.id)
      throw new Error("Aucun ID retourné lors de la création du produit");

    return data;
  }
}

// ==================== UI ====================

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

export default function AddProductPage({ params }: PageProps) {
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
    getProductName,
    isFormValid,
  } = useProductForm();

  // ✅ Redirect sign-in propre (pas pendant le render)
  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push("/sign-in");
  }, [isLoaded, isSignedIn, router]);

  const listingId = Number(params?.id);
  const hasValidListingId = Number.isFinite(listingId) && listingId > 0;

  // Données dynamiques basées sur la sélection
  const selectedCategoryData = PRODUCT_CATEGORIES.find(
    (cat) => cat.value === formData.category
  );
  const availableSubcategories = selectedCategoryData?.subcategories || [];
  const availableProducts =
    selectedCategoryData?.data.filter(
      (product) => product.category === formData.subcategory
    ) || [];

  const handleSubmit = useCallback(
    async (
      e?: React.SyntheticEvent,
      publish: boolean = false
    ): Promise<void> => {
      e?.preventDefault();

      if (!hasValidListingId) {
        toast.error("ID du listing invalide");
        return;
      }

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
        const productName = getProductName();
        const price = Number(formData.price);

        if (!Number.isFinite(price) || price < 0) {
          throw new Error("Prix invalide");
        }

        // ✅ description enrichie (comme tu faisais), mais propre
        const fullDescription = [
          formData.description.trim(),
          "",
          `Catégorie: ${formData.subcategory}`,
          `Prix: ${formData.price}€/${formData.unit}`,
          `Quantité disponible: ${formData.quantity}`,
          formData.delivery_options
            ? `Options de livraison: ${formData.delivery_options}`
            : "",
        ]
          .filter(Boolean)
          .join("\n");

        // ✅ IMPORTANT: ton schema TS indique que farm_id est requis
        // Dans ton cas, farm_id = listingId (tes FKs pointent vers listing.id)
        const productData: ProductInsert = {
          listing_id: listingId,
          farm_id: listingId,

          name: productName,
          description: fullDescription,

          price,
          unit: formData.unit,

          // ✅ requis par ton type ProductInsert
          available: true,

          // optionnel mais ok
          active: publish,

          // ⚠️ seulement si ta DB accepte "draft"
          // sinon: supprime cette ligne ou mets une valeur autorisée
          stock_status: publish ? "in_stock" : "draft",

          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };


        await ProductService.createProduct(productData);

        toast.success(
          publish
            ? "Produit publié avec succès !"
            : "Produit enregistré avec succès"
        );

        setTimeout(() => {
          // adapte selon ta route réelle (view-listing / shop / dashboard)
          router.push(`/view-listing/${listingId}`);
        }, 800);
      } catch (error) {
        console.error("Erreur lors de l'ajout du produit:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        if (errorMessage.toLowerCase().includes("permission")) {
          toast.error("Erreur de permissions. Vérifiez vos droits d'accès.");
        } else {
          toast.error(`Erreur lors de l'enregistrement: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
        setIsPublishing(false);
      }
    },
    [
      formData,
      getProductName,
      hasValidListingId,
      isFormValid,
      isSignedIn,
      router,
      setIsPublishing,
      setLoading,
      user,
      listingId,
    ]
  );

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-12 w-12 animate-spin"
            style={{ color: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>Chargement...</p>
        </div>
      </div>
    );
  }

  // si pas signed-in, on laisse l’effet rediriger
  if (!isSignedIn) return null;

  if (!hasValidListingId) {
    return (
      <div className="flex items-center justify-center h-[60vh] px-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <CardTitle>ID invalide</CardTitle>
            <CardDescription>
              Impossible d’ajouter un produit sans un listing valide.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const productName = getProductName();
  const requiredFields = [
    !productName && "Nom du produit",
    !formData.category && "Catégorie principale",
    !formData.subcategory && "Sous-catégorie",
    !formData.price && "Prix",
    !formData.quantity && "Quantité disponible",
    !formData.description && "Description du produit",
  ].filter(Boolean) as string[];

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
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
            Sélectionnez votre produit dans notre base de données ou créez un
            produit personnalisé
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-6" onSubmit={(e) => handleSubmit(e, false)}>
            {/* Catégorie principale */}
            <div className="space-y-2">
              <Label
                htmlFor="category"
                className="font-medium"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Catégorie principale *
              </Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleSelectChange("category", e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2"
                style={{
                  borderColor: COLORS.BORDER,
                  color: COLORS.TEXT_PRIMARY,
                }}
                required
              >
                <option value="">Sélectionnez une catégorie</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sous-catégorie */}
            {formData.category && (
              <div className="space-y-2">
                <Label
                  htmlFor="subcategory"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Sous-catégorie *
                </Label>
                <select
                  id="subcategory"
                  value={formData.subcategory}
                  onChange={(e) =>
                    handleSelectChange("subcategory", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: COLORS.BORDER,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  required
                >
                  <option value="">Sélectionnez une sous-catégorie</option>
                  {availableSubcategories.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Sélection du produit */}
            {formData.subcategory && (
              <div className="space-y-2">
                <Label
                  htmlFor="selectedProduct"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Produit *
                </Label>
                <select
                  id="selectedProduct"
                  value={formData.selectedProduct}
                  onChange={(e) =>
                    handleSelectChange("selectedProduct", e.target.value)
                  }
                  className="w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: COLORS.BORDER,
                    color: COLORS.TEXT_PRIMARY,
                  }}
                  required
                >
                  <option value="">Sélectionnez un produit</option>
                  {availableProducts.map((product) => (
                    <option key={product.name} value={product.name}>
                      {product.name}
                    </option>
                  ))}
                  <option value="custom">➕ Produit personnalisé</option>
                </select>
              </div>
            )}

            {/* Nom personnalisé */}
            {formData.selectedProduct === "custom" && (
              <div className="space-y-2">
                <Label
                  htmlFor="customName"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Nom du produit personnalisé *
                </Label>
                <Input
                  id="customName"
                  name="customName"
                  value={formData.customName}
                  onChange={handleChange}
                  placeholder="Ex: Tomates cerises variété ancienne"
                  required
                />
              </div>
            )}

            {/* Prix, Unité, Quantité */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="price"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Prix (€) *
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="unit"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Unité *
                </Label>
                <select
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleSelectChange("unit", e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-white text-sm focus:outline-none focus:ring-2"
                  style={{
                    borderColor: COLORS.BORDER,
                    color: COLORS.TEXT_PRIMARY,
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

              <div className="space-y-2">
                <Label
                  htmlFor="quantity"
                  className="font-medium"
                  style={{ color: COLORS.TEXT_PRIMARY }}
                >
                  Quantité *
                </Label>
                <Input
                  id="quantity"
                  name="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="10"
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
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Décrivez votre produit (variété, méthode, fraîcheur, etc.)"
                className="min-h-[120px]"
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
                name="delivery_options"
                value={formData.delivery_options}
                onChange={handleChange}
                placeholder="Ex: Livraison à domicile, récupération à la ferme..."
                className="min-h-[80px]"
              />
            </div>

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
            disabled={loading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              disabled={loading || !isFormValid()}
              onClick={(e) => handleSubmit(e, false)}
            >
              {loading && !isPublishing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={loading || !isFormValid()}
                  style={{
                    backgroundColor: COLORS.PRIMARY,
                    color: COLORS.TEXT_WHITE,
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
                    Une fois publié, votre produit "{productName}" sera visible
                    par tous les utilisateurs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => handleSubmit(e, true)}
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
}

export type { ProductFormData, ProductUnit };
