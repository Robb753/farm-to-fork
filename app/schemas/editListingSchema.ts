import { z } from "zod";

// Constantes pour les valeurs autorisées (basées sur vos composants)
const PRODUCT_TYPES = [
  "Fruits",
  "Légumes",
  "Produits laitiers",
  "Viande",
  "Œufs",
  "Produits transformés",
] as const;

const PRODUCTION_METHODS = [
  "Agriculture conventionnelle",
  "Agriculture biologique",
  "Agriculture durable",
  "Agriculture raisonnée",
] as const;

const PURCHASE_MODES = [
  "Vente directe à la ferme",
  "Marché local",
  "Livraison à domicile",
  "Point de vente collectif",
  "Click & Collect",
] as const;

const CERTIFICATIONS = [
  "Label AB",
  "Label Rouge",
  "AOC/AOP",
  "IGP",
  "Demeter",
] as const;

const AVAILABILITY_OPTIONS = [
  "Saisonnière",
  "Toute l'année",
  "Pré-commande",
  "Sur abonnement",
  "Événements spéciaux",
] as const;

const ADDITIONAL_SERVICES = [
  "Visite de la ferme",
  "Ateliers de cuisine",
  "Dégustation",
  "Activités pour enfants",
  "Événements pour professionnels",
] as const;

// Validation des fichiers image
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
];

const imageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "La taille du fichier ne doit pas dépasser 5MB",
  })
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes(file.type), {
    message: "Seuls les formats JPG, PNG et GIF sont acceptés",
  });

// Validation du numéro de téléphone français
const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

// Validation URL plus permissive (avec ou sans protocole)
const urlSchema = z
  .string()
  .refine(
    (url) => {
      if (!url) return true; // Optionnel
      // Ajouter https:// si pas de protocole
      const urlToTest = url.startsWith("http") ? url : `https://${url}`;
      try {
        new URL(urlToTest);
        return true;
      } catch {
        return false;
      }
    },
    { message: "URL invalide" }
  )
  .transform((url) => {
    if (!url) return url;
    // Normaliser l'URL en ajoutant https:// si nécessaire
    return url.startsWith("http") ? url : `https://${url}`;
  });

// Schéma de base sans la validation croisée
const baseEditListingSchema = z.object({
  // Informations obligatoires
  name: z
    .string()
    .min(1, "Le nom de la ferme est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  email: z
    .string()
    .min(1, "L'email est requis")
    .email("Adresse email invalide"),

  // Informations optionnelles avec validation
  phoneNumber: z
    .string()
    .optional()
    .refine((phone) => !phone || phoneRegex.test(phone), {
      message: "Numéro de téléphone invalide (format français attendu)",
    }),

  description: z
    .string()
    .optional()
    .refine((desc) => !desc || desc.length >= 10, {
      message: "La description doit contenir au moins 10 caractères",
    })
    .refine((desc) => !desc || desc.length <= 1000, {
      message: "La description ne peut pas dépasser 1000 caractères",
    }),

  website: urlSchema.optional(),

  // Sélections avec validation des valeurs autorisées
  product_type: z
    .array(z.enum(PRODUCT_TYPES))
    .min(1, "Sélectionnez au moins un type de produit")
    .max(6, "Maximum 6 types de produits"),

  production_method: z
    .array(z.enum(PRODUCTION_METHODS))
    .min(1, "Sélectionnez au moins une méthode de production")
    .max(4, "Maximum 4 méthodes de production"),

  purchase_mode: z
    .array(z.enum(PURCHASE_MODES))
    .min(1, "Sélectionnez au moins un mode d'achat")
    .max(5, "Maximum 5 modes d'achat"),

  // Optionnels avec validation
  certifications: z
    .array(z.enum(CERTIFICATIONS))
    .max(5, "Maximum 5 certifications")
    .default([]),

  availability: z
    .array(z.enum(AVAILABILITY_OPTIONS))
    .max(5, "Maximum 5 options de disponibilité")
    .default([]),

  additional_services: z
    .array(z.enum(ADDITIONAL_SERVICES))
    .max(5, "Maximum 5 services additionnels")
    .default([]),

  // Produits spécifiques - validation basée sur les noms dans vos JSON
  products: z
    .array(z.string().min(1, "Nom de produit invalide"))
    .max(50, "Maximum 50 produits sélectionnés")
    .default([]),

  // Images avec validation stricte
  images: z
    .array(imageFileSchema)
    .max(3, "Maximum 3 images autorisées")
    .default([])
    .refine(
      (files) => {
        // Vérifier que les noms de fichiers sont uniques
        const names = files.map((f) => f.name);
        return names.length === new Set(names).size;
      },
      {
        message: "Les noms de fichiers doivent être uniques",
      }
    ),
});

// Schéma complet avec validation croisée
export const editListingSchema = baseEditListingSchema.refine(
  (data) => {
    // Validation croisée : si des produits sont sélectionnés,
    // ils doivent correspondre aux types de produits choisis
    if (data.products.length > 0 && data.product_type.length === 0) {
      return false;
    }
    return true;
  },
  {
    message:
      "Vous devez sélectionner des types de produits avant de choisir des produits spécifiques",
    path: ["product_type"],
  }
);

// Schéma pour la validation partielle (brouillon)
export const editListingDraftSchema = baseEditListingSchema
  .partial({
    product_type: true,
    production_method: true,
    purchase_mode: true,
  })
  .extend({
    // Seuls le nom et l'email restent obligatoires pour un brouillon
    name: z.string().min(1, "Le nom de la ferme est requis"),
    email: z.string().email("Adresse email invalide"),
  });

// Types exportés
export type EditListingSchemaType = z.infer<typeof editListingSchema>;
export type EditListingDraftSchemaType = z.infer<typeof editListingDraftSchema>;

// Constantes exportées pour utilisation dans les composants
export {
  PRODUCT_TYPES,
  PRODUCTION_METHODS,
  PURCHASE_MODES,
  CERTIFICATIONS,
  AVAILABILITY_OPTIONS,
  ADDITIONAL_SERVICES,
};
