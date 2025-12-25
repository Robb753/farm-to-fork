"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Save,
  ArrowLeft,
  Users,
  Camera,
  Check,
  TractorIcon,
  ChevronRight,
  ChevronLeft,
} from "@/utils/icons";
import { supabase } from "@/utils/supabase/client";
import { editListingSchema } from "@/app/schemas/editListingSchema";
import type { z } from "zod";
import ProductSelector from "./ProductSelector";
import FileUpload from "./FileUpload";
import { cn } from "@/lib/utils";
import { COLORS } from "@/lib/config";

// ✅ Types Supabase
import type {
  Listing as DbListing,
  ListingImage as DbListingImage,
} from "@/lib/types/database";

/**
 * ✅ Type du formulaire directement inféré depuis le schéma
 */
type EditListingFormValues = z.input<typeof editListingSchema>;

/**
 * Types spécifiques pour chaque catégorie (form / UI)
 */
type ProductTypeId =
  | "Fruits"
  | "Légumes"
  | "Produits laitiers"
  | "Viande"
  | "Œufs"
  | "Produits transformés";

type ProductionMethodId =
  | "Agriculture conventionnelle"
  | "Agriculture biologique"
  | "Agriculture durable"
  | "Agriculture raisonnée";

type PurchaseModeId =
  | "Vente directe à la ferme"
  | "Marché local"
  | "Livraison à domicile"
  | "Point de vente collectif"
  | "Click & Collect";

type CertificationId =
  | "Label AB"
  | "Label Rouge"
  | "AOC/AOP"
  | "IGP"
  | "Demeter"
  | "HVE";

type AdditionalServiceId =
  | "Visite de la ferme"
  | "Ateliers de cuisine"
  | "Dégustation"
  | "Activités pour enfants"
  | "Événements pour professionnels";

type AvailabilityId =
  | "Saisonnière"
  | "Toute l'année"
  | "Pré-commande"
  | "Sur abonnement"
  | "Événements spéciaux";

/**
 * Props du composant
 */
interface EditListingProps {
  params: {
    id: string;
  };
  className?: string;
}

interface ProductUI {
  name: string;
  category: string;
  type: string;
  labels: string[];
}

/**
 * 🔗 Type de données utilisées dans l'UI
 * (normalisées à partir du Row Supabase)
 */
type ListingData = {
  id: DbListing["id"];
  name: string;
  email: string;
  phoneNumber: string;
  description: string;
  website: string;
  product_type: ProductTypeId[];
  production_method: ProductionMethodId[];
  purchase_mode: PurchaseModeId[];
  certifications: CertificationId[];
  availability: AvailabilityId[];
  additional_services: AdditionalServiceId[];
  products: string[]; // ✅ UI only (ProductSelector). Pas stocké dans la table "products" (boutique)
  active: DbListing["active"];
  listingImages: Pick<DbListingImage, "url">[];
};

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

/**
 * Utilitaires de validation des types pour l'UI
 */
const isValidProductType = (value: string): value is ProductTypeId =>
  [
    "Fruits",
    "Légumes",
    "Produits laitiers",
    "Viande",
    "Œufs",
    "Produits transformés",
  ].includes(value);

const isValidProductionMethod = (value: string): value is ProductionMethodId =>
  [
    "Agriculture conventionnelle",
    "Agriculture biologique",
    "Agriculture durable",
    "Agriculture raisonnée",
  ].includes(value);

const isValidPurchaseMode = (value: string): value is PurchaseModeId =>
  [
    "Vente directe à la ferme",
    "Marché local",
    "Livraison à domicile",
    "Point de vente collectif",
    "Click & Collect",
  ].includes(value);

const isValidCertification = (value: string): value is CertificationId =>
  ["Label AB", "Label Rouge", "AOC/AOP", "IGP", "Demeter", "HVE"].includes(
    value
  );

const isValidAdditionalService = (
  value: string
): value is AdditionalServiceId =>
  [
    "Visite de la ferme",
    "Ateliers de cuisine",
    "Dégustation",
    "Activités pour enfants",
    "Événements pour professionnels",
  ].includes(value);

const isValidAvailability = (value: string): value is AvailabilityId =>
  [
    "Saisonnière",
    "Toute l'année",
    "Pré-commande",
    "Sur abonnement",
    "Événements spéciaux",
  ].includes(value);

/**
 * Helper: convertit en string[]
 * - supporte: array, json string '["a","b"]', string "a,b;c|d"
 */
const toStringArray = (val: unknown): string[] => {
  if (Array.isArray(val))
    return val.filter((v): v is string => typeof v === "string");

  if (typeof val === "string") {
    const trimmed = val.trim();
    if (!trimmed) return [];

    // JSON array ?
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((v): v is string => typeof v === "string");
      }
    } catch {
      // ignore
    }

    // fallback CSV-like
    return trimmed
      .split(/[,;|]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  return [];
};

/**
 * Stepper
 */
const STEPS: StepItem[] = [
  { id: 1, title: "Informations générales", icon: Users },
  { id: 2, title: "Produits & Services", icon: TractorIcon },
  { id: 3, title: "Méthodes & Services", icon: Check },
  { id: 4, title: "Photos & Finalisation", icon: Camera },
];

/**
 * Options UI (checkboxes)
 */
const PRODUCT_TYPE_OPTIONS: CheckboxItem[] = [
  { id: "Fruits", label: "Fruits" },
  { id: "Légumes", label: "Légumes" },
  { id: "Produits laitiers", label: "Produits laitiers" },
  { id: "Viande", label: "Viande" },
  { id: "Œufs", label: "Œufs" },
  { id: "Produits transformés", label: "Produits transformés" },
];

const PRODUCTION_METHOD_OPTIONS: CheckboxItem[] = [
  { id: "Agriculture conventionnelle", label: "Conventionnelle" },
  { id: "Agriculture biologique", label: "Biologique" },
  { id: "Agriculture durable", label: "Durable" },
  { id: "Agriculture raisonnée", label: "Raisonnée" },
];

const PURCHASE_MODE_OPTIONS: CheckboxItem[] = [
  { id: "Vente directe à la ferme", label: "Vente directe à la ferme" },
  { id: "Marché local", label: "Marché local" },
  { id: "Livraison à domicile", label: "Livraison à domicile" },
  { id: "Point de vente collectif", label: "Point de vente collectif" },
  { id: "Click & Collect", label: "Click & Collect" },
];

const CERTIFICATION_OPTIONS: CheckboxItem[] = [
  { id: "Label AB", label: "Label AB" },
  { id: "Label Rouge", label: "Label Rouge" },
  { id: "AOC/AOP", label: "AOC / AOP" },
  { id: "IGP", label: "IGP" },
  { id: "Demeter", label: "Demeter" },
  { id: "HVE", label: "HVE" },
];

const AVAILABILITY_OPTIONS_UI: CheckboxItem[] = [
  { id: "Saisonnière", label: "Saisonnière" },
  { id: "Toute l'année", label: "Toute l'année" },
  { id: "Pré-commande", label: "Pré-commande" },
  { id: "Sur abonnement", label: "Sur abonnement" },
  { id: "Événements spéciaux", label: "Événements spéciaux" },
];

const ADDITIONAL_SERVICE_OPTIONS: CheckboxItem[] = [
  { id: "Visite de la ferme", label: "Visite de la ferme" },
  { id: "Ateliers de cuisine", label: "Ateliers de cuisine" },
  { id: "Dégustation", label: "Dégustation" },
  { id: "Activités pour enfants", label: "Activités pour enfants" },
  { id: "Événements pour professionnels", label: "Événements pro" },
];

const arrayToDbString = (val: unknown): string | null => {
  if (!val) return null;
  if (Array.isArray(val)) {
    const cleaned = val
      .filter((v): v is string => typeof v === "string")
      .map((s) => s.trim())
      .filter(Boolean);
    return cleaned.length ? cleaned.join(",") : null; // CSV
  }
  if (typeof val === "string") {
    const t = val.trim();
    return t ? t : null;
  }
  return null;
};

const dbStringToArray = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val))
    return val.filter((v): v is string => typeof v === "string");
  if (typeof val === "string") {
    const t = val.trim();
    if (!t) return [];
    // support csv "a,b;c|d"
    return t
      .split(/[,;|]/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
};


/**
 * Service Supabase typé
 */
class ListingService {
  /**
   * Récupère un listing + images
   */
  static async fetchListing(
    id: number,
    userEmail: string
  ): Promise<ListingData> {
    try {
      type RawListing = DbListing & {
        listingImages: { url: string }[] | null;
      };

      const { data, error } = await supabase
        .from("listing")
        .select("*, listingImages(url)")
        .eq("createdBy", userEmail)
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Aucun listing trouvé");

      const raw = data as RawListing;

      const listing: ListingData = {
        id: raw.id,
        name: raw.name ?? "",
        email: raw.email ?? "",
        phoneNumber: raw.phoneNumber ?? "",
        description: raw.description ?? "",
        website: raw.website ?? "",
        product_type: toStringArray(raw.product_type).filter(
          isValidProductType
        ),
        production_method: toStringArray(raw.production_method).filter(
          isValidProductionMethod
        ),
        purchase_mode: toStringArray(raw.purchase_mode).filter(
          isValidPurchaseMode
        ),
        certifications: toStringArray(raw.certifications).filter(
          isValidCertification
        ),
        availability: toStringArray(raw.availability).filter(
          isValidAvailability
        ),
        additional_services: toStringArray(raw.additional_services).filter(
          isValidAdditionalService
        ),

        // ✅ UI only : si tu veux persister ça, fais une colonne dédiée (jsonb) ou table pivot
        products: [],

        active: raw.active ?? false,
        listingImages: Array.isArray(raw.listingImages)
          ? raw.listingImages
          : [],
      };

      return listing;
    } catch (error) {
      console.error("Erreur lors de la récupération du listing:", error);
      throw error;
    }
  }

  /**
   * Mise à jour du listing (exclut products/images du form)
   */
  static async updateListing(
    id: number,
    values: EditListingFormValues,
    isPublishing: boolean,
    currentActive: boolean
  ): Promise<void> {
    try {
      // on enlève ce qui n'existe pas dans listing
      const { products: _products, images: _images, ...rest } = values;

      // ✅ mapping form -> DB (DB attend string|null sur ces champs)
      const updateData: Partial<DbListing> = {
        ...rest,
        product_type: arrayToDbString(rest.product_type),
        production_method: arrayToDbString(rest.production_method),
        purchase_mode: arrayToDbString(rest.purchase_mode),
        certifications: arrayToDbString(rest.certifications), // ✅ FIX de ton erreur
        availability: arrayToDbString(rest.availability),
        additional_services: arrayToDbString(rest.additional_services),

        active: isPublishing || currentActive || false,
        updated_at: new Date().toISOString(),
        modified_at: new Date().toISOString(),

        ...(isPublishing && !currentActive
          ? { published_at: new Date().toISOString() }
          : {}),
      };

      const { error } = await supabase
        .from("listing")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du listing:", error);
      throw error;
    }
  }

  /**
   * ✅ IMPORTANT :
   * La table "products" = produits boutique (prix, stock, etc.)
   * On ne doit PAS la modifier depuis EditListing.
   */
  static async updateProducts(): Promise<void> {
    return;
  }

  /**
   * Upload des images via le bucket + insertion dans listingImages
   */
  static async uploadImages(
    listingId: number,
    images: (string | File)[]
  ): Promise<void> {
    try {
      const imageFiles = images.filter(
        (img): img is File => img instanceof File
      );

      if (imageFiles.length === 0) return;

      for (const image of imageFiles) {
        const fileName = `${Date.now()}-${image.name}`;
        const fileExt = fileName.split(".").pop() || "jpg";

        const { error: uploadError } = await supabase.storage
          .from("listingImages")
          .upload(fileName, image, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error("Erreur upload:", uploadError);
          throw new Error(`Erreur lors du téléchargement de ${image.name}`);
        }

        // ⚠️ Assure-toi que NEXT_PUBLIC_IMAGE_URL = URL publique du bucket + "/" à la fin
        const imageUrl = `${process.env.NEXT_PUBLIC_IMAGE_URL}${fileName}`;

        const { error: insertError } = await supabase
          .from("listingImages")
          .insert([{ url: imageUrl, listing_id: listingId }]);

        if (insertError) {
          console.error("Erreur insertion image:", insertError);
          throw new Error(`Erreur lors de l'enregistrement de ${image.name}`);
        }
      }
    } catch (error) {
      console.error("Erreur lors de l'upload des images:", error);
      throw error;
    }
  }
}

/**
 * Composant EditListing principal
 */
const EditListing: React.FC<EditListingProps> = ({
  params,
  className = "",
}) => {
  const [listing, setListing] = useState<ListingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isLoadingInitialData, setIsLoadingInitialData] =
    useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  const { user, isLoaded } = useUser();
  const router = useRouter();

  const form = useForm<EditListingFormValues>({
    resolver: zodResolver(editListingSchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      description: undefined,
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
    register,
    formState: { errors },
  } = form;

  const handleImagesChange = useCallback(
    (files: File[]) => {
      setValue("images", files, { shouldDirty: true, shouldTouch: true });
    },
    [setValue]
  );

  const productTypeValues = watch("product_type") ?? [];
  const productionMethodValues = watch("production_method") ?? [];
  const purchaseModeValues = watch("purchase_mode") ?? [];
  const certificationsValues = watch("certifications") ?? [];
  const availabilityValues = watch("availability") ?? [];
  const additionalServicesValues = watch("additional_services") ?? [];
  const selectedProducts = watch("products") ?? [];
  // const imagesValues = watch("images") ?? []; // (inutile ici)

  const progressValue = (currentStep / STEPS.length) * 100;

  /**
   * Chargement initial
   */
  useEffect(() => {
    if (!isLoaded || !user) return;

    const fetchListing = async (): Promise<void> => {
      setIsLoadingInitialData(true);

      if (!params?.id) {
        toast.error("Identifiant de fiche manquant.");
        router.replace("/");
        return;
      }

      try {
        const userEmail = user.primaryEmailAddress?.emailAddress;
        if (!userEmail) throw new Error("Email utilisateur non trouvé");

        const listingId = Number(params.id);
        if (!Number.isFinite(listingId))
          throw new Error("ID de listing invalide");

        const data = await ListingService.fetchListing(listingId, userEmail);

        setListing(data);

        reset({
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          description: data.description,
          website: data.website,
          product_type: data.product_type,
          production_method: data.production_method,
          purchase_mode: data.purchase_mode,
          certifications: data.certifications,
          availability: data.availability,
          additional_services: data.additional_services,
          products: data.products,
          images: [],
        });
      } catch (error) {
        console.error("Erreur lors de la récupération:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";

        if (errorMessage.toLowerCase().includes("autoris")) {
          toast.error("Autorisations insuffisantes");
        } else {
          toast.error("Impossible de charger la fiche.");
        }
        router.replace("/");
      } finally {
        setIsLoadingInitialData(false);
      }
    };

    fetchListing();
  }, [isLoaded, user, params.id, reset, router]);

  /**
   * Soumission
   */
  const onSubmit = useCallback(
    async (values: EditListingFormValues, isPublishing: boolean = false) => {
      if (!listing) return;

      setIsSubmitting(true);

      try {
        const listingId = Number(params.id);
        if (!Number.isFinite(listingId))
          throw new Error("ID de listing invalide");

        await ListingService.updateListing(
          listingId,
          values,
          isPublishing,
          listing.active
        );

        // ✅ IMPORTANT : pas de modification de la table "products" ici
        await ListingService.updateProducts();

        if (values.images && values.images.length > 0) {
          await ListingService.uploadImages(listingId, values.images);
        }

        if (isPublishing) {
          toast.success("Fiche publiée avec succès !");
          setTimeout(() => router.push("/dashboard/farms"), 1000);
        } else {
          toast.success("Modifications enregistrées");
        }
      } catch (error) {
        console.error("Erreur de soumission:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Erreur inconnue";
        toast.error(`Erreur lors de la sauvegarde: ${errorMessage}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [listing, params.id, router]
  );

  /**
   * Gestion des valeurs tableaux (checkboxes)
   */
  const toggleArrayValue = useCallback(
    (fieldName: keyof EditListingFormValues, value: string): void => {
      const currentValues = (getValues(fieldName as any) as string[]) ?? [];

      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      setValue(fieldName as any, newValues as any, {
        shouldValidate: false,
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [getValues, setValue]
  );

  const goToNextStep = () => {
    setCompletedSections((prev) =>
      prev.includes(currentStep) ? prev : [...prev, currentStep]
    );
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Loading / erreurs
  if (isLoadingInitialData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            className="h-12 w-12 animate-spin"
            style={{ color: COLORS.PRIMARY }}
          />
          <p style={{ color: COLORS.TEXT_SECONDARY }}>
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-4 text-center" style={{ color: COLORS.TEXT_MUTED }}>
        Aucune donnée trouvée
      </div>
    );
  }

  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-stone-50 to-amber-50/30",
        className
      )}
    >
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <FormProvider {...form}>
          <form onSubmit={handleSubmit((values) => onSubmit(values, false))}>
            {/* Header global */}
            <div className="mb-8 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 mb-4"
                onClick={() => router.back()}
                type="button"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
              <h1
                className="text-3xl font-normal mb-2"
                style={{ color: COLORS.TEXT_PRIMARY }}
              >
                Modifier votre ferme
              </h1>
              <p style={{ color: COLORS.TEXT_SECONDARY }}>
                Mettez à jour les informations de votre fiche en quelques
                étapes.
              </p>
            </div>

            {/* Card principale */}
            <Card style={{ borderColor: COLORS.BORDER }}>
              <CardHeader
                className="space-y-4"
                style={{
                  backgroundColor: COLORS.BG_GRAY,
                  borderColor: COLORS.BORDER,
                }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle style={{ color: COLORS.TEXT_PRIMARY }}>
                      Édition de la fiche
                    </CardTitle>
                    <CardDescription style={{ color: COLORS.TEXT_SECONDARY }}>
                      Étape {currentStep} sur {STEPS.length}
                    </CardDescription>
                  </div>
                  <div className="w-40">
                    <Progress value={progressValue} className="h-2" />
                  </div>
                </div>

                {/* Stepper */}
                <div className="flex items-center justify-between gap-2">
                  {STEPS.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = completedSections.includes(step.id);
                    return (
                      <button
                        key={step.id}
                        type="button"
                        onClick={() => setCurrentStep(step.id)}
                        className={cn(
                          "flex-1 flex items-center gap-2 px-3 py-2 rounded-full border text-xs md:text-sm transition",
                          isActive &&
                            "border-amber-500 bg-amber-50 text-amber-900",
                          !isActive &&
                            "border-stone-200 bg-white text-stone-600",
                          isCompleted && "ring-1 ring-emerald-400"
                        )}
                      >
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-stone-100">
                          <Icon className="h-3 w-3" />
                        </span>
                        <span className="truncate">{step.title}</span>
                      </button>
                    );
                  })}
                </div>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {/* Étape 1 : Informations générales */}
                {currentStep === 1 && (
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Nom de la ferme *
                        </label>
                        <Input
                          {...register("name")}
                          placeholder="Ferme des Trois Vallées"
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500">
                            {errors.name.message as string}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Email *</label>
                        <Input
                          {...register("email")}
                          type="email"
                          placeholder="contact@ferme.fr"
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500">
                            {errors.email.message as string}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Téléphone</label>
                        <Input
                          {...register("phoneNumber")}
                          placeholder="06 12 34 56 78"
                        />
                        {errors.phoneNumber && (
                          <p className="text-xs text-red-500">
                            {errors.phoneNumber.message as string}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Site web</label>
                        <Input
                          {...register("website")}
                          placeholder="www.maferme.fr"
                        />
                        {errors.website && (
                          <p className="text-xs text-red-500">
                            {errors.website.message as string}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Description de la ferme
                      </label>
                      <Textarea
                        {...register("description")}
                        rows={8}
                        placeholder="Présentez votre ferme, votre histoire, vos valeurs..."
                      />
                      {errors.description && (
                        <p className="text-xs text-red-500">
                          {errors.description.message as string}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Étape 2 : Produits & Services */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    {/* Types de produits proposés */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Types de produits proposés *
                      </label>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {PRODUCT_TYPE_OPTIONS.map((opt) => {
                          const values =
                            (productTypeValues as EditListingFormValues["product_type"]) ??
                            [];
                          const id =
                            opt.id as EditListingFormValues["product_type"][number];
                          const isSelected = values.includes(id);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                toggleArrayValue("product_type", opt.id)
                              }
                              className={cn(
                                "flex items-center justify-between rounded-full border px-3 py-1.5 text-xs md:text-sm",
                                isSelected &&
                                  "border-amber-500 bg-amber-50 text-amber-900",
                                !isSelected &&
                                  "border-stone-200 bg-white text-stone-600"
                              )}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                          );
                        })}
                      </div>

                      {errors.product_type && (
                        <p className="text-xs text-red-500">
                          {errors.product_type.message as string}
                        </p>
                      )}
                    </div>

                    {/* Produits détaillés (UI only) */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Produits détaillés
                      </label>
                      <ProductSelector
                        selectedProducts={selectedProducts}
                        selectedTypes={productTypeValues}
                        onChange={(newProducts: string[]) =>
                          setValue("products", newProducts, {
                            shouldDirty: true,
                            shouldTouch: true,
                          })
                        }
                      />
                      {errors.products && (
                        <p className="text-xs text-red-500">
                          {errors.products.message as string}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Étape 3 : Méthodes & Services */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    {/* Méthodes de production */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Méthodes de production *
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {PRODUCTION_METHOD_OPTIONS.map((opt) => {
                          const methods =
                            (productionMethodValues as EditListingFormValues["production_method"]) ??
                            [];
                          const id =
                            opt.id as EditListingFormValues["production_method"][number];
                          const isSelected = methods.includes(id);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                toggleArrayValue("production_method", opt.id)
                              }
                              className={cn(
                                "flex items-center justify-between rounded-full border px-3 py-1.5 text-xs md:text-sm",
                                isSelected &&
                                  "border-amber-500 bg-amber-50 text-amber-900",
                                !isSelected &&
                                  "border-stone-200 bg-white text-stone-600"
                              )}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                          );
                        })}
                      </div>
                      {errors.production_method && (
                        <p className="text-xs text-red-500">
                          {errors.production_method.message as string}
                        </p>
                      )}
                    </div>

                    {/* Modes d'achat */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Modes d&apos;achat *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {PURCHASE_MODE_OPTIONS.map((opt) => {
                          const modes =
                            (purchaseModeValues as EditListingFormValues["purchase_mode"]) ??
                            [];
                          const id =
                            opt.id as EditListingFormValues["purchase_mode"][number];
                          const isSelected = modes.includes(id);

                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() =>
                                toggleArrayValue("purchase_mode", opt.id)
                              }
                              className={cn(
                                "flex items-center justify-between rounded-full border px-3 py-1.5 text-xs md:text-sm",
                                isSelected &&
                                  "border-amber-500 bg-amber-50 text-amber-900",
                                !isSelected &&
                                  "border-stone-200 bg-white text-stone-600"
                              )}
                            >
                              <span>{opt.label}</span>
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                          );
                        })}
                      </div>
                      {errors.purchase_mode && (
                        <p className="text-xs text-red-500">
                          {errors.purchase_mode.message as string}
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Certifications */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Certifications
                        </label>
                        <div className="space-y-1">
                          {CERTIFICATION_OPTIONS.map((opt) => {
                            const certs = (certificationsValues ??
                              []) as string[];
                            const isSelected = certs.includes(opt.id);

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  toggleArrayValue("certifications", opt.id)
                                }
                                className={cn(
                                  "flex items-center justify-between rounded-full border px-3 py-1.5 text-xs md:text-sm w-full",
                                  isSelected &&
                                    "border-emerald-500 bg-emerald-50 text-emerald-900",
                                  !isSelected &&
                                    "border-stone-200 bg-white text-stone-600"
                                )}
                              >
                                <span>{opt.label}</span>
                                {isSelected && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Disponibilité */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Disponibilité
                        </label>
                        <div className="space-y-1">
                          {AVAILABILITY_OPTIONS_UI.map((opt) => {
                            const availabilities = (availabilityValues ??
                              []) as string[];
                            const isSelected = availabilities.includes(opt.id);

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  toggleArrayValue("availability", opt.id)
                                }
                                className={cn(
                                  "flex items-center justify-between rounded-full border px-3 py-1.5 text-xs md:text-sm w-full",
                                  isSelected &&
                                    "border-amber-500 bg-amber-50 text-amber-900",
                                  !isSelected &&
                                    "border-stone-200 bg-white text-stone-600"
                                )}
                              >
                                <span>{opt.label}</span>
                                {isSelected && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Services complémentaires */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Services complémentaires
                        </label>
                        <div className="space-y-1">
                          {ADDITIONAL_SERVICE_OPTIONS.map((opt) => {
                            const services = (additionalServicesValues ??
                              []) as string[];
                            const isSelected = services.includes(opt.id);

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  toggleArrayValue(
                                    "additional_services",
                                    opt.id
                                  )
                                }
                                className={cn(
                                  "flex items-center justify-between rounded-full border px-3 py-1.5 text-xs md:text-sm w-full",
                                  isSelected &&
                                    "border-amber-500 bg-amber-50 text-amber-900",
                                  !isSelected &&
                                    "border-stone-200 bg-white text-stone-600"
                                )}
                              >
                                <span>{opt.label}</span>
                                {isSelected && <Check className="h-3 w-3" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Étape 4 : Photos & Finalisation */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Photos de la ferme
                      </label>
                      <FileUpload
                        setImages={handleImagesChange}
                        imageList={listing.listingImages}
                        maxImages={3}
                        className="mt-6"
                      />
                      {errors.images && (
                        <p className="text-xs text-red-500">
                          {errors.images.message as string}
                        </p>
                      )}
                    </div>

                    {listing.listingImages.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          Images déjà publiées
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {listing.listingImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="h-20 w-28 overflow-hidden rounded-md border border-stone-200 bg-stone-50"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={img.url}
                                alt={`Image ${idx + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-stone-500">
                      Les nouvelles images s&apos;ajouteront à celles déjà
                      enregistrées. Maximum 3 images par ajout.
                    </p>
                  </div>
                )}

                {/* Navigation étapes */}
                <div className="flex items-center justify-between pt-4 border-t border-stone-100">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={goToPrevStep}
                    disabled={currentStep === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentStep < STEPS.length && (
                      <Button
                        type="button"
                        className="gap-2"
                        style={{
                          backgroundColor: COLORS.PRIMARY,
                          color: COLORS.TEXT_WHITE,
                        }}
                        onClick={goToNextStep}
                      >
                        Suivant
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}

                    {currentStep === STEPS.length && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isSubmitting}
                          onClick={handleSubmit((values) =>
                            onSubmit(values, false)
                          )}
                          className="gap-2"
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Enregistrer le brouillon
                        </Button>

                        <Button
                          type="button"
                          disabled={isSubmitting}
                          onClick={handleSubmit((values) =>
                            onSubmit(values, true)
                          )}
                          className="gap-2"
                          style={{
                            backgroundColor: COLORS.PRIMARY,
                            color: COLORS.TEXT_WHITE,
                          }}
                        >
                          {isSubmitting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Save className="h-4 w-4" />
                          )}
                          Publier
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default EditListing;

/**
 * Export des types pour utilisation externe (si besoin)
 */
export type { EditListingProps, ListingData, ProductUI as Product };
