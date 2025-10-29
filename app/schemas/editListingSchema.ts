import { z } from "zod";

/* -------------------------------------------
 * Constants
 * -----------------------------------------*/
export const PRODUCT_TYPES = [
  "Fruits",
  "Légumes",
  "Produits laitiers",
  "Viande",
  "Œufs",
  "Produits transformés",
] as const;

export const PRODUCTION_METHODS = [
  "Agriculture conventionnelle",
  "Agriculture biologique",
  "Agriculture durable",
  "Agriculture raisonnée",
] as const;

export const PURCHASE_MODES = [
  "Vente directe à la ferme",
  "Marché local",
  "Livraison à domicile",
  "Point de vente collectif",
  "Click & Collect",
] as const;

export const CERTIFICATIONS = [
  "Label AB",
  "Label Rouge",
  "AOC/AOP",
  "IGP",
  "Demeter",
] as const;

export const AVAILABILITY_OPTIONS = [
  "Saisonnière",
  "Toute l'année",
  "Pré-commande",
  "Sur abonnement",
  "Événements spéciaux",
] as const;

export const ADDITIONAL_SERVICES = [
  "Visite de la ferme",
  "Ateliers de cuisine",
  "Dégustation",
  "Activités pour enfants",
  "Événements pour professionnels",
] as const;

/* -------------------------------------------
 * Helpers
 * -----------------------------------------*/
const normalizeUrl = (value?: string) => {
  if (!value || value.trim() === "") return undefined;
  const candidate = value.startsWith("http") ? value : `https://${value}`;
  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
};

const toE164FR = (value?: string) => {
  if (!value || value.trim() === "") return undefined;
  const digits = value.replace(/[^\d+]/g, "");
  let num = digits.replace(/^00/, "+");
  if (num.startsWith("0")) num = `+33${num.slice(1)}`;
  return /^\+33\d{9}$/.test(num) ? num : null;
};

/* -------------------------------------------
 * Images
 * -----------------------------------------*/
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file
const MAX_TOTAL_SIZE = 15 * 1024 * 1024; // 15MB total
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/avif",
] as const;

const fileLikeSchema = z
  .custom<File>((val) => typeof File !== "undefined" && val instanceof File, {
    message: "Fichier image invalide",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, {
    message: "La taille d'une image ne doit pas dépasser 5MB",
  })
  .refine((file) => ACCEPTED_IMAGE_TYPES.includes((file as File).type as any), {
    message: "Formats acceptés: JPG, PNG, GIF, WEBP, AVIF",
  });

const imageUrlSchema = z
  .string()
  .url("URL d'image invalide")
  .refine((u) => /\.(jpe?g|png|gif|webp|avif)$/i.test(new URL(u).pathname), {
    message:
      "L'URL d'image doit se terminer par .jpg, .png, .gif, .webp, .avif",
  });

const imageItemSchema = z.union([fileLikeSchema, imageUrlSchema]);

/* -------------------------------------------
 * Single-field schemas that use effects (no .min/.max after them)
 * -----------------------------------------*/
const websiteSchema = z
  .string()
  .trim()
  .optional()
  .superRefine((value, ctx) => {
    if (!value) return;
    const normalized = normalizeUrl(value);
    if (normalized === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "URL invalide" });
    } else {
      // @ts-expect-error stash normalized value
      ctx.parent?.set("website", normalized);
    }
  });

const phoneSchema = z
  .string()
  .optional()
  .transform((s) => (s ? s.trim() : s))
  .superRefine((value, ctx) => {
    if (!value) return;
    const e164 = toE164FR(value);
    if (e164 === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Numéro de téléphone invalide (format FR attendu)",
      });
    } else {
      // @ts-expect-error stash normalized value
      ctx.parent?.set("phoneNumber", e164);
    }
  });

/* -------------------------------------------
 * Base schema (use .trim() so .min/.max/.email exist)
 * -----------------------------------------*/
const baseEditListingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom de la ferme est requis")
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),

  email: z
    .string()
    .trim()
    .min(1, "L'email est requis")
    .email("Adresse email invalide"),

  phoneNumber: phoneSchema, // normalized if present

  description: z
    .string()
    .trim()
    .min(10, "La description doit contenir au moins 10 caractères")
    .max(1000, "La description ne peut pas dépasser 1000 caractères")
    .optional(),

  website: websiteSchema, // normalized to https://...

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

  certifications: z.array(z.enum(CERTIFICATIONS)).max(5).default([]),
  availability: z.array(z.enum(AVAILABILITY_OPTIONS)).max(5).default([]),
  additional_services: z.array(z.enum(ADDITIONAL_SERVICES)).max(5).default([]),

  products: z
    .array(z.string().trim().min(1, "Nom de produit invalide"))
    .max(50, "Maximum 50 produits sélectionnés")
    .default([]),

  images: z
    .array(imageItemSchema)
    .max(3, "Maximum 3 images autorisées")
    .default([]),
});

/* -------------------------------------------
 * Cross-field checks
 * -----------------------------------------*/
export const editListingSchema = baseEditListingSchema.superRefine(
  (data, ctx) => {
    // products => require product_type (extra safety)
    if (data.products.length > 0 && data.product_type.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Vous devez sélectionner des types de produits avant de choisir des produits spécifiques",
        path: ["product_type"],
      });
    }

    // images: total size
    const files = (data.images as unknown[]).filter(
      (i) => typeof i !== "string"
    ) as File[];
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La taille totale des images ne doit pas dépasser 15MB",
        path: ["images"],
      });
    }

    // images: unique filenames
    if (files.length > 0) {
      const names = files.map((f) => f.name);
      if (names.length !== new Set(names).size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Les noms de fichiers doivent être uniques",
          path: ["images"],
        });
      }
    }
  }
);

/* -------------------------------------------
 * Draft schema
 * -----------------------------------------*/
export const editListingDraftSchema = baseEditListingSchema
  .partial({
    product_type: true,
    production_method: true,
    purchase_mode: true,
  })
  .extend({
    name: z.string().trim().min(1, "Le nom de la ferme est requis"),
    email: z.string().trim().email("Adresse email invalide"),
  });

/* -------------------------------------------
 * Types
 * -----------------------------------------*/
export type EditListingSchemaType = z.infer<typeof editListingSchema>;
export type EditListingDraftSchemaType = z.infer<typeof editListingDraftSchema>;
