import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Interface pour un produit
 */
export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string; // kg, pièce, douzaine, etc.
  farm_id: number;
  farm_name: string;
  image_url?: string;
  stock_status?: "in_stock" | "low_stock" | "out_of_stock";
  description?: string;
}

/**
 * Interface pour un item dans le panier
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Interface pour le panier complet
 */
export interface Cart {
  farmId: number | null;
  farmName: string | null;
  items: CartItem[];
  deliveryMode: "pickup" | "delivery" | null;
  lastUpdated: number | null;
}

/**
 * Interface du store panier
 */
interface CartStore {
  cart: Cart;

  // Actions
  addItem: (product: Product, quantity: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  setDeliveryMode: (mode: "pickup" | "delivery") => void;
  clearCart: () => void;

  // Getter (paramétré — ne peut pas être un selector externe statique)
  canAddToCart: (farmId: number) => boolean;
}

/**
 * État initial du panier
 */
const initialCart: Cart = {
  farmId: null,
  farmName: null,
  items: [],
  deliveryMode: null,
  lastUpdated: null,
};

const CART_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 heures

/**
 * Anti double-clic (MVP-friendly):
 * on bloque les ajouts répétés sur le même produit pendant ~350ms
 * (évite les double-clics involontaires).
 */
const ADD_THROTTLE_MS = 350;
const lastAddByProductId = new Map<number, number>();

/**
 * Store Zustand pour le panier
 * Persisté dans localStorage
 */
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      cart: initialCart,

      /**
       * Ajouter un produit au panier
       */
      addItem: (product: Product, quantity: number) => {
        // ✅ Guard quantité
        const qty = Number(quantity);
        if (!Number.isFinite(qty) || qty <= 0) return;

        // ✅ Anti double-clic (par produit)
        const now = Date.now();
        const last = lastAddByProductId.get(product.id) ?? 0;
        if (now - last < ADD_THROTTLE_MS) return;
        lastAddByProductId.set(product.id, now);

        set((state) => {
          // Si le panier est vide, initialiser avec la ferme
          if (!state.cart.farmId) {
            return {
              cart: {
                ...state.cart,
                farmId: product.farm_id,
                farmName: product.farm_name,
                items: [{ product, quantity: qty }],
                lastUpdated: Date.now(),
              },
            };
          }

          // Vérifier que le produit vient de la même ferme
          if (state.cart.farmId !== product.farm_id) {
            console.warn("Impossible d'ajouter un produit d'une autre ferme");
            return state;
          }

          // Vérifier si le produit existe déjà
          const existingItemIndex = state.cart.items.findIndex(
            (item) => item.product.id === product.id,
          );

          if (existingItemIndex > -1) {
            // Mettre à jour la quantité
            const newItems = [...state.cart.items];
            newItems[existingItemIndex] = {
              ...newItems[existingItemIndex],
              quantity: newItems[existingItemIndex].quantity + qty,
            };
            return {
              cart: {
                ...state.cart,
                items: newItems,
                lastUpdated: Date.now(),
              },
            };
          }

          // Ajouter le nouveau produit
          return {
            cart: {
              ...state.cart,
              items: [...state.cart.items, { product, quantity: qty }],
              lastUpdated: Date.now(),
            },
          };
        });
      },

      /**
       * Retirer un produit du panier
       */
      removeItem: (productId: number) => {
        set((state) => {
          const newItems = state.cart.items.filter(
            (item) => item.product.id !== productId,
          );

          // Si le panier est vide, réinitialiser
          if (newItems.length === 0) {
            return { cart: initialCart };
          }

          return {
            cart: {
              ...state.cart,
              items: newItems,
              lastUpdated: Date.now(),
            },
          };
        });
      },

      /**
       * Mettre à jour la quantité d'un produit
       */
      updateQuantity: (productId: number, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            // Si quantité = 0, retirer le produit
            const newItems = state.cart.items.filter(
              (item) => item.product.id !== productId,
            );

            // Si le panier est vide, réinitialiser
            if (newItems.length === 0) {
              return { cart: initialCart };
            }

            return {
              cart: {
                ...state.cart,
                items: newItems,
                lastUpdated: Date.now(),
              },
            };
          }

          const newItems = state.cart.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item,
          );

          return {
            cart: {
              ...state.cart,
              items: newItems,
              lastUpdated: Date.now(),
            },
          };
        });
      },

      /**
       * Définir le mode de livraison
       */
      setDeliveryMode: (mode: "pickup" | "delivery") => {
        set((state) => ({
          cart: {
            ...state.cart,
            deliveryMode: mode,
          },
        }));
      },

      /**
       * Vider le panier
       */
      clearCart: () => {
        set({ cart: initialCart });
      },

      /**
       * Vérifier si on peut ajouter un produit au panier
       */
      canAddToCart: (farmId: number) => {
        const state = get();
        return !state.cart.farmId || state.cart.farmId === farmId;
      },
    }),
    {
      name: "farm2fork-cart",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const { lastUpdated } = state.cart;
        if (lastUpdated && Date.now() - lastUpdated > CART_EXPIRY_MS) {
          state.clearCart();
        }
      },
    },
  ),
);

/**
 * Selectors externes — chaque composant ne se re-render que si la valeur calculée change,
 * et non sur n'importe quel changement du store.
 */
export const useCartTotalItems = () =>
  useCartStore((s) => s.cart.items.reduce((sum, item) => sum + item.quantity, 0));

export const useCartTotalPrice = () =>
  useCartStore((s) =>
    s.cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  );
