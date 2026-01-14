/**
 * Statuts possibles d'une commande
 */
export type OrderStatus =
  | "pending" // En attente de confirmation ferme
  | "confirmed" // Confirmée par la ferme
  | "ready" // Prête pour retrait/livraison
  | "delivered" // Livrée/récupérée
  | "cancelled"; // Annulée

/**
 * Statuts de paiement
 */
export type PaymentStatus =
  | "unpaid" // Non payée
  | "paid" // Payée
  | "refunded"; // Remboursée

/**
 * Qui a annulé la commande
 */
export type CancelledBy = "customer" | "farmer" | "admin";

/**
 * Modes de livraison
 */
export type DeliveryMode = "pickup" | "delivery";

/**
 * Item dans une commande (snapshot du produit au moment de la commande)
 */
export interface OrderItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  unit: string;
  imageUrl?: string;
}

/**
 * Adresse de livraison (snapshot au moment de la commande)
 */
export interface DeliveryAddress {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  additionalInfo?: string;
}

/**
 * Commande complète (DB)
 */
export interface Order {
  id: number; // ✅ CORRIGÉ: bigint en DB = number en TS
  user_id: string;
  farm_id: number;

  // Items et prix
  items: OrderItem[];
  total_price: number;

  // Livraison
  delivery_mode: DeliveryMode;
  delivery_day: string;
  delivery_address?: DeliveryAddress;

  // Statuts
  status: OrderStatus;
  payment_status: PaymentStatus;

  // Notes
  customer_notes?: string;
  farmer_notes?: string;

  // Annulation
  cancelled_reason?: string;
  cancelled_by?: CancelledBy;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Metadata flex
  metadata?: Record<string, any>;
}

/**
 * Payload pour créer une commande (client → API)
 */
export interface CreateOrderPayload {
  farmId: number;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
  deliveryMode: DeliveryMode;
  deliveryDay: string;
  deliveryAddress?: DeliveryAddress;
  customerNotes?: string;
}

/**
 * Réponse de l'API après création de commande
 */
export interface CreateOrderResponse {
  success: boolean;
  order?: Order;
  error?: string;
  details?: string[];
}

/**
 * Payload pour mettre à jour le statut d'une commande
 */
export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  farmerNotes?: string;
  cancelledReason?: string;
}

/**
 * Commande avec données jointes (pour affichage)
 */
export interface OrderWithRelations extends Order {
  farm?: {
    id: number;
    name: string;
    email: string;
  };
  user?: {
    id: string;
    email: string;
    full_name?: string;
  };
}
