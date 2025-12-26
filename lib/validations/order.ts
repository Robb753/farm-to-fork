/**
 * Schémas de validation Zod pour les commandes
 */

import { z } from "zod";

/**
 * Validation de l'adresse de livraison
 */
export const deliveryAddressSchema = z.object({
  street: z.string().min(1, "Rue requise"),
  city: z.string().min(1, "Ville requise"),
  postalCode: z.string().min(1, "Code postal requis"),
  country: z.string().min(1, "Pays requis"),
  additionalInfo: z.string().optional(),
});

/**
 * Validation d'un item de commande
 */
export const orderItemSchema = z.object({
  productId: z.number().int().positive("ID produit invalide"),
  quantity: z
    .number()
    .int()
    .positive("Quantité doit être positive")
    .max(1000, "Quantité trop élevée"),
});

/**
 * Validation pour créer une commande
 */
export const createOrderSchema = z.object({
  farmId: z.number().int().positive("ID ferme invalide"),
  items: z
    .array(orderItemSchema)
    .min(1, "Au moins un produit requis")
    .max(50, "Maximum 50 produits par commande"),
  deliveryMode: z.enum(["pickup", "delivery"], {
    errorMap: () => ({ message: "Mode de livraison invalide" }),
  }),
  deliveryDay: z.string().min(1, "Jour de livraison requis"),
  deliveryAddress: deliveryAddressSchema.optional(),
  customerNotes: z
    .string()
    .max(500, "Notes trop longues (max 500 caractères)")
    .optional(),
});

/**
 * Validation pour mettre à jour le statut d'une commande
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "ready", "delivered", "cancelled"], {
    errorMap: () => ({ message: "Statut invalide" }),
  }),
  farmerNotes: z
    .string()
    .max(500, "Notes trop longues (max 500 caractères)")
    .optional(),
  cancelledReason: z
    .string()
    .max(500, "Raison trop longue (max 500 caractères)")
    .optional(),
});

/**
 * Type inféré pour TypeScript
 */
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
