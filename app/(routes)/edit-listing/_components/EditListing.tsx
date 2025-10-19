"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import {
  Loader2,
  Save,
  Globe,
  Send,
  ArrowLeft,
  Users,
  Camera,
  Check,
  ChevronRight,
  TractorIcon,
  Mail,
  Phone,
  ChevronLeft,
} from "@/utils/icons";
import { supabase } from "@/utils/supabase/client";
import {
  editListingSchema,
  EditListingSchemaType,
} from "@/app/schemas/editListingSchema";
import ProductSelector from "./ProductSelector";
import FileUpload from "./FileUpload";

// Types
interface EditListingProps {
  params: {
    id: string;
  };
}

// Interface pour les produits (doit correspondre à vos JSON)
interface Product {
  name: string;
  category: string;
  type: string;
  labels: string[];
}

interface ListingData {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  description: string;
  website: string;
  product_type: string[];
  production_method: string[];
  purchase_mode: string[];
  certifications: string[];
  availability: string[];
  additional_services: string[];
  products: string[];
  active: boolean;
  listingImages: { url: string }[];
}

interface StepItem {
  id: number;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CheckboxItem {
  id: string;
  label: string;
  icon?: string;
}

interface ProductTypeItem extends CheckboxItem {
  id:
    | "Fruits"
    | "Légumes"
    | "Produits laitiers"
    | "Viande"
    | "Œufs"
    | "Produits transformés";
}

interface ProductionMethodItem extends CheckboxItem {
  id:
    | "Agriculture conventionnelle"
    | "Agriculture biologique"
    | "Agriculture durable"
    | "Agriculture raisonnée";
}

interface PurchaseModeItem extends CheckboxItem {
  id:
    | "Vente directe à la ferme"
    | "Marché local"
    | "Livraison à domicile"
    | "Point de vente collectif"
    | "Click & Collect";
}

interface CertificationItem extends CheckboxItem {
  id: "Label AB" | "Label Rouge" | "AOC/AOP" | "IGP" | "Demeter";
}

interface AdditionalServiceItem extends CheckboxItem {
  id:
    | "Visite de la ferme"
    | "Ateliers de cuisine"
    | "Dégustation"
    | "Activités pour enfants"
    | "Événements pour professionnels";
}

// Configuration des étapes
const steps: StepItem[] = [
  { id: 1, title: "Informations générales", icon: Users },
  { id: 2, title: "Produits & Services", icon: TractorIcon },
  { id: 3, title: "Méthodes & Services", icon: Check },
  { id: 4, title: "Photos & Finalisation", icon: Camera },
];

// Configuration des options
const productTypeItems: ProductTypeItem[] = [
  { id: "Fruits", label: "Fruits", icon: "🍎" },
  { id: "Légumes", label: "Légumes", icon: "🥕" },
  { id: "Produits laitiers", label: "Produits laitiers", icon: "🥛" },
  { id: "Viande", label: "Viande", icon: "🥩" },
  { id: "Œufs", label: "Œufs", icon: "🥚" },
  { id: "Produits transformés", label: "Produits transformés", icon: "🍯" },
];

const productionMethodItems: ProductionMethodItem[] = [
  { id: "Agriculture conventionnelle", label: "Agriculture conventionnelle" },
  { id: "Agriculture biologique", label: "Agriculture biologique" },
  { id: "Agriculture durable", label: "Agriculture durable" },
  { id: "Agriculture raisonnée", label: "Agriculture raisonnée" },
];

const purchaseModeItems: PurchaseModeItem[] = [
  { id: "Vente directe à la ferme", label: "Vente directe à la ferme" },
  { id: "Marché local", label: "Marché local" },
  { id: "Livraison à domicile", label: "Livraison à domicile" },
  { id: "Point de vente collectif", label: "Point de vente collectif" },
  { id: "Click & Collect", label: "Click & Collect" },
];

const certificationsItems: CertificationItem[] = [
  { id: "Label AB", label: "Label AB" },
  { id: "Label Rouge", label: "Label Rouge" },
  { id: "AOC/AOP", label: "AOC/AOP" },
  { id: "IGP", label: "IGP" },
  { id: "Demeter", label: "Demeter" },
];

const additionalServicesItems: AdditionalServiceItem[] = [
  { id: "Visite de la ferme", label: "Visite de la ferme" },
  { id: "Ateliers de cuisine", label: "Ateliers de cuisine" },
  { id: "Dégustation", label: "Dégustation" },
  { id: "Activités pour enfants", label: "Activités pour enfants" },
  {
    id: "Événements pour professionnels",
    label: "Événements pour professionnels",
  },
];

const availabilityItems: CheckboxItem[] = [
  { id: "Saisonnière", label: "Saisonnière" },
  { id: "Toute l'année", label: "Toute l'année" },
  { id: "Pré-commande", label: "Pré-commande" },
  { id: "Sur abonnement", label: "Sur abonnement" },
  { id: "Événements spéciaux", label: "Événements spéciaux" },
];

// Note: Remplacez ces données de test par vos imports réels :
import vegetables from "@/app/_data/vegetables.json";
import fruits from "@/app/_data/fruits.json";
import dairyProducts from "@/app/_data/dairy-products.json";

const allProducts = {
  Légumes: vegetables as Product[],
  Fruits: fruits as Product[],
  "Produits laitiers": dairyProducts as Product[],
};

export default function EditListing({ params }: EditListingProps) {
  const [listing, setListing] = useState<ListingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingInitialData, setIsLoadingInitialData] =
    useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSections, setCompletedSections] = useState<number[]>([]);
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const form = useForm<EditListingSchemaType>({
    resolver: zodResolver(editListingSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      description: "",
      website: "",
      product_type: [],
      production_method: [],
      purchase_mode: [],
      certifications: [],
      availability: [],
      additional_services: [],
      products: [],
      images: [],
    },
  });

  const {
    reset,
    handleSubmit,
    setValue,
    getValues,
    watch,
    control,
    register,
    formState: { errors },
  } = form;

  const watchedProductTypes = watch("product_type") ?? [];
  const watchedProductionMethods = watch("production_method") ?? [];
  const watchedCertifications = watch("certifications") ?? [];
  const watchedPurchaseModes = watch("purchase_mode") ?? [];
  const watchedAdditionalServices = watch("additional_services") ?? [];

  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchListing = async () => {
      setIsLoadingInitialData(true);

      if (!params?.id) {
        toast.error("Identifiant de fiche manquant.");
        router.replace("/");
        return;
      }

      try {
        const { data, error } = await supabase
          .from("listing")
          .select("*, listingImages(url)")
          .eq("createdBy", user?.primaryEmailAddress?.emailAddress)
          .eq("id", params.id)
          .single();

        if (error) throw error;

        if (data) {
          setListing(data as ListingData);
          reset({
            name: data.name || "",
            email: data.email || "",
            phoneNumber: data.phoneNumber || "",
            description: data.description || "",
            website: data.website || "",
            product_type: data.product_type || [],
            production_method: data.production_method || [],
            purchase_mode: data.purchase_mode || [],
            certifications: data.certifications || [],
            availability: data.availability || [],
            additional_services: data.additional_services || [],
            products: data.products || [],
            images: [],
          });
        } else {
          toast.error("Aucun listing trouvé ou autorisations insuffisantes");
          router.replace("/");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération :", error);
        toast.error("Impossible de charger la fiche.");
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    fetchListing();
  }, [isLoaded, user, params.id, reset, router]);
  

  const onSubmit = async (
    values: EditListingSchemaType,
    isPublishing = false
  ): Promise<void> => {
    setIsSubmitting(true);

    try {
      const updateData = {
        ...values,
        active: isPublishing || listing?.active || false,
        modified_at: new Date().toISOString(),
        ...(isPublishing &&
          !listing?.active && { published_at: new Date().toISOString() }),
      };

      const { error } = await supabase
        .from("listing")
        .update(updateData)
        .eq("id", params.id);

      if (error) throw error;

      // Gestion des produits
      await supabase.from("products").delete().eq("listing_id", params.id);

      if (values.products.length > 0) {
        const formattedProducts = values.products.map((name) => ({
          listing_id: params.id,
          name,
          available: true,
        }));

        const { error: insertError } = await supabase
          .from("products")
          .insert(formattedProducts);

        if (insertError) {
          console.error(
            "Erreur lors de l'insertion des produits :",
            insertError
          );
          toast.error("Erreur lors de l'enregistrement des produits");
        }
      }

      // Gestion des images
      if (values.images.length > 0) {
        for (const image of values.images) {
          const fileName = `${Date.now()}-${image.name}`;
          const fileExt = fileName.split(".").pop();

          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("listingImages")
              .upload(fileName, image, {
                contentType: `image/${fileExt}`,
                upsert: false,
              });

          if (uploadError) {
            toast.error("Erreur lors du téléchargement des images");
            console.error("Upload error:", uploadError);
          } else {
            const imageUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${fileName}`;
            await supabase
              .from("listingImages")
              .insert([{ url: imageUrl, listing_id: params.id }]);
          }
        }
      }

      if (isPublishing) {
        toast.success("Fiche publiée avec succès !");
        setTimeout(() => {
          router.push("/dashboard/farms");
        }, 1000);
      } else {
        toast.success("Modifications enregistrées");
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("Une erreur est survenue lors de la sauvegarde");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ CORRECTION: Une seule fonction générique pour gérer tous les toggles
  const toggleArrayValue = (
    fieldName: keyof EditListingSchemaType,
    value: string
  ): void => {
    const currentValues = getValues(fieldName as any) as string[];

    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];

    setValue(fieldName as any, newValues, {
      shouldValidate: false,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-500" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return <p className="p-4">Aucune donnée trouvée</p>;
  }

  const progress = (completedSections.length / steps.length) * 100;
  const productTypes = watch("product_type");
  const selectedTypes = Array.isArray(productTypes) ? productTypes : [];
  const products = watch("products");
  const selectedProducts = Array.isArray(products) ? products : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <FormProvider {...form}>
          <form onSubmit={handleSubmit((values) => onSubmit(values, false))}>
            {/* Header */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                  onClick={() => router.back()}
                  type="button"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Retour
                </Button>
                <div>
                  <h1 className="text-3xl font-normal text-stone-800 mb-2">
                    Modifier votre ferme
                  </h1>
                  <p className="text-stone-600">
                    Complétez votre fiche ferme pour attirer plus de clients
                  </p>
                </div>
              </div>
            </div>
            {/* Progress Bar */}
            <div className="mb-8">
              <Progress value={progress} className="h-2 mb-4" />
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(step.id)}
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all hover:scale-105 ${
                          completedSections.includes(step.id)
                            ? "bg-green-500 text-white shadow-md"
                            : currentStep === step.id
                              ? "bg-emerald-500 text-white shadow-md"
                              : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                        }`}
                      >
                        {completedSections.includes(step.id) ? (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          step.id
                        )}
                      </button>
                      <div className="mt-2 text-center">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(step.id)}
                          className={`text-sm font-medium hover:text-emerald-600 transition-colors ${
                            completedSections.includes(step.id)
                              ? "text-green-600"
                              : currentStep === step.id
                                ? "text-emerald-600"
                                : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </button>
                      </div>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-px mx-4 ${
                          completedSections.includes(step.id)
                            ? "bg-green-500"
                            : currentStep > step.id
                              ? "bg-emerald-500"
                              : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Step 1: Informations générales */}
            {currentStep === 1 && (
              <Card className="border-stone-200 shadow-sm">
                <CardHeader className="bg-stone-100/50 border-b border-stone-200">
                  <CardTitle className="flex items-center gap-3 text-stone-800">
                    <div className="w-8 h-8 rounded-lg bg-stone-500 flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    Informations générales
                  </CardTitle>
                  <CardDescription className="text-stone-600 p-2">
                    Présentez votre ferme et vos coordonnées
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="farm-name"
                        className="text-sm font-medium text-stone-700 flex items-center gap-2"
                      >
                        <TractorIcon className="w-4 h-4 text-emerald-500" />
                        Nom de la ferme *
                      </Label>
                      <Input
                        id="farm-name"
                        placeholder="Ex: Ferme du Soleil Levant"
                        className="border-stone-200 focus:border-stone-400 focus:ring-stone-400/20"
                        {...register("name")}
                      />
                      {errors.name && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="phone"
                        className="text-sm font-medium text-stone-700 flex items-center gap-2"
                      >
                        <Phone className="w-4 h-4 text-emerald-500" />
                        Téléphone
                      </Label>
                      <Input
                        id="phone"
                        placeholder="06 12 34 56 78"
                        className="border-stone-200 focus:border-stone-400 focus:ring-stone-400/20"
                        {...register("phoneNumber")}
                      />
                      {errors.phoneNumber && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.phoneNumber.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label
                        htmlFor="email"
                        className="text-sm font-medium text-stone-700 flex items-center gap-2"
                      >
                        <Mail className="w-4 h-4 text-emerald-500" />
                        Email *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="contact@ferme-soleil.fr"
                        className="border-stone-200 focus:border-stone-400 focus:ring-stone-400/20"
                        {...register("email")}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Label
                        htmlFor="website"
                        className="text-sm font-medium text-stone-700 flex items-center gap-2"
                      >
                        <Globe className="w-4 h-4 text-emerald-500" />
                        Site web
                      </Label>
                      <Input
                        id="website"
                        placeholder="www.ferme-soleil.fr"
                        className="border-stone-200 focus:border-stone-400 focus:ring-stone-400/20"
                        {...register("website")}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label
                      htmlFor="description"
                      className="text-sm font-medium text-stone-700"
                    >
                      Description de votre ferme
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre ferme, votre histoire, vos valeurs..."
                      className="min-h-[120px] border-stone-200 focus:border-stone-400 focus:ring-stone-400/20 resize-none"
                      {...register("description")}
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.description.message}
                      </p>
                    )}
                    <p className="text-xs text-stone-500">
                      Une belle description attire plus de clients !
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Step 2: Produits & Services */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <Card className="border-stone-200 shadow-sm">
                  <CardHeader className="bg-stone-100/50 border-b border-stone-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                        <TractorIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <CardTitle className="text-stone-800">
                          Types de produits
                        </CardTitle>
                        <CardDescription className="text-stone-600">
                          Sélectionnez les types de produits que vous proposez
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-3 gap-4">
                      {productTypeItems.map((product) => {
                        const isSelected = selectedTypes.includes(product.id);
                        return (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() =>
                              toggleArrayValue("product_type", product.id)
                            }
                            className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:scale-105 ${
                              isSelected
                                ? "border-green-400 bg-green-50 shadow-md"
                                : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            )}
                            <input
                              type="checkbox"
                              id={`product-${product.id}`}
                              name={`product-type-${product.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="sr-only"
                            />
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{product.icon}</span>
                              <div>
                                <Label
                                  htmlFor={`product-${product.id}`}
                                  className="cursor-pointer font-medium text-gray-800"
                                >
                                  {product.label}
                                </Label>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {errors.product_type && (
                      <p className="text-red-500 text-sm mt-4 p-3 bg-red-50 rounded-lg">
                        {errors.product_type.message}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Produits spécifiques - Affichage conditionnel amélioré */}
                {selectedTypes.length > 0 ? (
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-xl font-semibold text-white">
                            Produits spécifiques
                          </CardTitle>
                          <CardDescription className="text-blue-100">
                            Détaillez votre offre
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <ProductSelector
                        selectedTypes={selectedTypes}
                        selectedProducts={selectedProducts}
                        onChange={(products) => {
                          setValue("products", products, {
                            shouldValidate: false,
                            shouldDirty: true,
                          });
                        }}
                      />

                      {/* Résumé des produits sélectionnés */}
                      {selectedProducts.length > 0 && (
                        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                          <div className="flex items-center gap-2 mb-3">
                            <svg
                              className="w-5 h-5 text-blue-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-blue-700 font-medium">
                              {selectedProducts.length} produit
                              {selectedProducts.length > 1 ? "s" : ""}{" "}
                              sélectionné
                              {selectedProducts.length > 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {selectedProducts.slice(0, 8).map((product) => (
                              <span
                                key={product}
                                className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                              >
                                {product}
                              </span>
                            ))}
                            {selectedProducts.length > 8 && (
                              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                                +{selectedProducts.length - 8} autres
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  /* Message d'encouragement quand aucun type n'est sélectionné */
                  <Card className="border-0 shadow-lg">
                    <CardContent className="pt-12 pb-24 px-10 text-center">
                      <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <TractorIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">
                        Commencez par sélectionner vos types de produits
                      </h3>
                      <p className="text-gray-500">
                        Cela nous aidera à vous proposer les produits
                        spécifiques correspondants
                      </p>
                      <div className="mt-4 text-sm text-gray-400">
                        👆 Cliquez sur une catégorie ci-dessus pour commencer
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {/* Step 3: Certifications & Méthodes*/}
            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Grid responsive pour les 4 sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Méthodes de production */}
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            Méthodes de production
                          </CardTitle>
                          <CardDescription className="text-blue-100 text-sm">
                            Comment cultivez-vous vos produits ?
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      {productionMethodItems.map((method) => {
                        const isSelected = watchedProductionMethods.includes(
                          method.id
                        );
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() =>
                              toggleArrayValue("production_method", method.id)
                            }
                            className={`flex items-center space-x-3 w-full text-left p-3 rounded-lg transition-all cursor-pointer border-2 ${
                              isSelected
                                ? "border-blue-300 bg-blue-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              id={`method-${method.id}`}
                              name={`production-method-${method.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`method-${method.id}`}
                              className="cursor-pointer text-sm font-medium flex-1"
                            >
                              {method.label}
                            </Label>
                            {isSelected && (
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}

                      {errors.production_method && (
                        <p className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-lg">
                          {errors.production_method.message}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Certifications */}
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            Certifications
                          </CardTitle>
                          <CardDescription className="text-purple-100 text-sm">
                            Quels labels possédez-vous ?
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      {certificationsItems.map((cert) => {
                        const isSelected = watchedCertifications.includes(
                          cert.id
                        );
                        return (
                          <button
                            key={cert.id}
                            type="button"
                            onClick={() =>
                              toggleArrayValue("certifications", cert.id)
                            }
                            className={`flex items-center space-x-3 w-full text-left p-3 rounded-lg transition-all cursor-pointer border-2 ${
                              isSelected
                                ? "border-purple-300 bg-purple-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-purple-500 bg-purple-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              id={`cert-${cert.id}`}
                              name={`certification-${cert.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`cert-${cert.id}`}
                              className="cursor-pointer text-sm font-medium flex-1"
                            >
                              {cert.label}
                            </Label>
                            {isSelected && (
                              <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>

                  {/* Modes d'achat */}
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-teal-500 to-green-500 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            Modes d'achat
                          </CardTitle>
                          <CardDescription className="text-green-100 text-sm">
                            Comment vos clients achètent-ils ?
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      {purchaseModeItems.map((mode) => {
                        const isSelected = watchedPurchaseModes.includes(
                          mode.id
                        );
                        return (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() =>
                              toggleArrayValue("purchase_mode", mode.id)
                            }
                            className={`flex items-center space-x-3 w-full text-left p-3 rounded-lg transition-all cursor-pointer border-2 ${
                              isSelected
                                ? "border-green-300 bg-green-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-green-500 bg-green-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              id={`mode-${mode.id}`}
                              name={`purchase-mode-${mode.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`mode-${mode.id}`}
                              className="cursor-pointer text-sm font-medium flex-1"
                            >
                              {mode.label}
                            </Label>
                            {isSelected && (
                              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}

                      {errors.purchase_mode && (
                        <p className="text-red-500 text-sm mt-2 p-3 bg-red-50 rounded-lg">
                          {errors.purchase_mode.message}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Services additionnels */}
                  <Card className="border-0 shadow-lg overflow-hidden">
                    <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                        </div>
                        <div>
                          <CardTitle className="text-lg font-semibold">
                            Services additionnels
                          </CardTitle>
                          <CardDescription className="text-orange-100 text-sm">
                            Quels services complémentaires proposez-vous ?
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                      {additionalServicesItems.map((service) => {
                        const isSelected = watchedAdditionalServices.includes(
                          service.id
                        );
                        return (
                          <button
                            key={service.id}
                            type="button"
                            onClick={() =>
                              toggleArrayValue(
                                "additional_services",
                                service.id
                              )
                            }
                            className={`flex items-center space-x-3 w-full text-left p-3 rounded-lg transition-all cursor-pointer border-2 ${
                              isSelected
                                ? "border-orange-300 bg-orange-50 shadow-sm"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                isSelected
                                  ? "border-orange-500 bg-orange-500"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="w-3 h-3 text-white" />
                              )}
                            </div>
                            <input
                              type="checkbox"
                              id={`service-${service.id}`}
                              name={`additional-service-${service.id}`}
                              checked={isSelected}
                              onChange={() => {}}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`service-${service.id}`}
                              className="cursor-pointer text-sm font-medium flex-1"
                            >
                              {service.label}
                            </Label>
                            {isSelected && (
                              <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
            {/* Step 4: Photos */}
            {currentStep === 4 && (
              <Card className="shadow-lg border-0">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Photos de votre ferme
                  </CardTitle>
                  <CardDescription className="text-indigo-50">
                    Ajoutez des photos attrayantes pour présenter votre ferme
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <FileUpload
                    setImages={(files) =>
                      setValue("images", files, { shouldValidate: true })
                    }
                    imageList={listing?.listingImages}
                  />
                </CardContent>
              </Card>
            )}
            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1}
                className="gap-2"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </Button>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer le brouillon
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    onClick={() =>
                      setCurrentStep(Math.min(steps.length, currentStep + 1))
                    }
                    className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                    type="button"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        disabled={isSubmitting}
                        className="gap-2 bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Check className="w-4 h-4" />
                        Publier la fiche
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="border-green-100">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-green-700">
                          Êtes-vous sûr de vouloir publier cette ferme ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Une fois publiée, votre ferme sera visible par tous
                          les utilisateurs.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          disabled={isSubmitting}
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() =>
                            handleSubmit((values) => onSubmit(values, true))()
                          }
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Confirmer et publier
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          </form>
        </FormProvider>
      </div>
    </div>
  );
}
