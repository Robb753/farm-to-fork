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

  // Getters
  getTotalItems: () => number;
  getTotalPrice: () => number;
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
};

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
        set((state) => {
          // Si le panier est vide, initialiser avec la ferme
          if (!state.cart.farmId) {
            return {
              cart: {
                ...state.cart,
                farmId: product.farm_id,
                farmName: product.farm_name,
                items: [{ product, quantity }],
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
            (item) => item.product.id === product.id
          );

          if (existingItemIndex > -1) {
            // Mettre à jour la quantité
            const newItems = [...state.cart.items];
            newItems[existingItemIndex].quantity += quantity;
            return {
              cart: {
                ...state.cart,
                items: newItems,
              },
            };
          }

          // Ajouter le nouveau produit
          return {
            cart: {
              ...state.cart,
              items: [...state.cart.items, { product, quantity }],
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
            (item) => item.product.id !== productId
          );

          // Si le panier est vide, réinitialiser
          if (newItems.length === 0) {
            return { cart: initialCart };
          }

          return {
            cart: {
              ...state.cart,
              items: newItems,
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
            return get().removeItem(productId), state;
          }

          const newItems = state.cart.items.map((item) =>
            item.product.id === productId ? { ...item, quantity } : item
          );

          return {
            cart: {
              ...state.cart,
              items: newItems,
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
       * Obtenir le nombre total d'articles
       */
      getTotalItems: () => {
        const state = get();
        return state.cart.items.reduce((total, item) => total + item.quantity, 0);
      },

      /**
       * Obtenir le prix total
       */
      getTotalPrice: () => {
        const state = get();
        return state.cart.items.reduce(
          (total, item) => total + item.product.price * item.quantity,
          0
        );
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
    }
  )
);
