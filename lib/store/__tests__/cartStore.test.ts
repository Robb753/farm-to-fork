import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore, type Product } from "@/lib/store/cartStore";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const p1: Product = {
  id: 1,
  name: "Tomates",
  price: 3.5,
  unit: "kg",
  farm_id: 10,
  farm_name: "La Ferme du Soleil",
  stock_status: "in_stock",
};

const p2: Product = {
  id: 2,
  name: "Carottes",
  price: 2.0,
  unit: "kg",
  farm_id: 10,
  farm_name: "La Ferme du Soleil",
  stock_status: "in_stock",
};

const pOtherFarm: Product = {
  id: 3,
  name: "Pommes",
  price: 4.0,
  unit: "kg",
  farm_id: 99,
  farm_name: "Autre Ferme",
  stock_status: "in_stock",
};

const emptyCart = { farmId: null, farmName: null, items: [], deliveryMode: null };

// ─── Helper ──────────────────────────────────────────────────────────────────

/** Reset the store to a clean state before each test. */
function resetCart() {
  useCartStore.setState({ cart: emptyCart });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("cartStore — addItem", () => {
  beforeEach(resetCart);

  it("initializes the cart with the first product", () => {
    useCartStore.getState().addItem(p1, 2);
    const { cart } = useCartStore.getState();

    expect(cart.farmId).toBe(10);
    expect(cart.farmName).toBe("La Ferme du Soleil");
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0]).toMatchObject({ product: p1, quantity: 2 });
  });

  it("adds a second product from the same farm", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "La Ferme du Soleil", items: [{ product: p1, quantity: 1 }], deliveryMode: null },
    });
    useCartStore.getState().addItem(p2, 3);
    const { items } = useCartStore.getState().cart;

    expect(items).toHaveLength(2);
    expect(items[1]).toMatchObject({ product: p2, quantity: 3 });
  });

  it("blocks a product from a different farm", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "La Ferme du Soleil", items: [{ product: p1, quantity: 1 }], deliveryMode: null },
    });
    useCartStore.getState().addItem(pOtherFarm, 1);
    const { cart } = useCartStore.getState();

    expect(cart.items).toHaveLength(1);
    expect(cart.farmId).toBe(10);
  });

  it("rejects quantity = 0", () => {
    useCartStore.getState().addItem(p1, 0);
    expect(useCartStore.getState().cart.farmId).toBeNull();
  });

  it("rejects negative quantity", () => {
    useCartStore.getState().addItem(p1, -5);
    expect(useCartStore.getState().cart.items).toHaveLength(0);
  });

  it("rejects non-finite quantity (NaN)", () => {
    useCartStore.getState().addItem(p1, NaN);
    expect(useCartStore.getState().cart.items).toHaveLength(0);
  });
});

describe("cartStore — removeItem", () => {
  beforeEach(resetCart);

  it("removes a product from the cart", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [{ product: p1, quantity: 2 }, { product: p2, quantity: 1 }], deliveryMode: null },
    });
    useCartStore.getState().removeItem(p1.id);

    const { items } = useCartStore.getState().cart;
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe(p2.id);
  });

  it("resets the cart entirely when the last item is removed", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [{ product: p1, quantity: 1 }], deliveryMode: "pickup" },
    });
    useCartStore.getState().removeItem(p1.id);

    const { cart } = useCartStore.getState();
    expect(cart.farmId).toBeNull();
    expect(cart.farmName).toBeNull();
    expect(cart.deliveryMode).toBeNull();
  });

  it("is a no-op for an unknown productId", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [{ product: p1, quantity: 1 }], deliveryMode: null },
    });
    useCartStore.getState().removeItem(999);

    expect(useCartStore.getState().cart.items).toHaveLength(1);
  });
});

describe("cartStore — updateQuantity", () => {
  beforeEach(resetCart);

  it("updates the quantity of an existing product", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [{ product: p1, quantity: 1 }], deliveryMode: null },
    });
    useCartStore.getState().updateQuantity(p1.id, 5);

    expect(useCartStore.getState().cart.items[0].quantity).toBe(5);
  });

  it("removes the product when quantity is set to 0", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [{ product: p1, quantity: 3 }], deliveryMode: null },
    });
    useCartStore.getState().updateQuantity(p1.id, 0);

    expect(useCartStore.getState().cart.items).toHaveLength(0);
  });

  it("removes the product when quantity is negative", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [{ product: p1, quantity: 3 }], deliveryMode: null },
    });
    useCartStore.getState().updateQuantity(p1.id, -1);

    expect(useCartStore.getState().cart.items).toHaveLength(0);
  });

  it("resets the cart when the last item reaches quantity 0", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [{ product: p1, quantity: 2 }], deliveryMode: "delivery" },
    });
    useCartStore.getState().updateQuantity(p1.id, 0);

    expect(useCartStore.getState().cart.farmId).toBeNull();
  });
});

describe("cartStore — clearCart", () => {
  beforeEach(resetCart);

  it("empties the cart completely", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [{ product: p1, quantity: 2 }], deliveryMode: "pickup" },
    });
    useCartStore.getState().clearCart();

    const { cart } = useCartStore.getState();
    expect(cart.farmId).toBeNull();
    expect(cart.farmName).toBeNull();
    expect(cart.items).toHaveLength(0);
    expect(cart.deliveryMode).toBeNull();
  });
});

describe("cartStore — setDeliveryMode", () => {
  beforeEach(resetCart);

  it("sets pickup mode", () => {
    useCartStore.getState().setDeliveryMode("pickup");
    expect(useCartStore.getState().cart.deliveryMode).toBe("pickup");
  });

  it("sets delivery mode", () => {
    useCartStore.getState().setDeliveryMode("delivery");
    expect(useCartStore.getState().cart.deliveryMode).toBe("delivery");
  });
});

describe("cartStore — canAddToCart", () => {
  beforeEach(resetCart);

  it("returns true when the cart is empty (any farm)", () => {
    expect(useCartStore.getState().canAddToCart(10)).toBe(true);
    expect(useCartStore.getState().canAddToCart(99)).toBe(true);
  });

  it("returns true for the same farm", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [], deliveryMode: null },
    });
    expect(useCartStore.getState().canAddToCart(10)).toBe(true);
  });

  it("returns false for a different farm", () => {
    useCartStore.setState({
      cart: { farmId: 10, farmName: "Test", items: [], deliveryMode: null },
    });
    expect(useCartStore.getState().canAddToCart(99)).toBe(false);
  });
});

describe("cartStore — computed totals", () => {
  beforeEach(resetCart);

  it("calculates total item count correctly", () => {
    useCartStore.setState({
      cart: {
        farmId: 10,
        farmName: "Test",
        items: [{ product: p1, quantity: 2 }, { product: p2, quantity: 3 }],
        deliveryMode: null,
      },
    });
    const total = useCartStore.getState().cart.items
      .reduce((sum, item) => sum + item.quantity, 0);

    expect(total).toBe(5);
  });

  it("calculates total price correctly", () => {
    useCartStore.setState({
      cart: {
        farmId: 10,
        farmName: "Test",
        // p1: 3.5 × 2 = 7.0
        // p2: 2.0 × 3 = 6.0  → total = 13.0
        items: [{ product: p1, quantity: 2 }, { product: p2, quantity: 3 }],
        deliveryMode: null,
      },
    });
    const total = useCartStore.getState().cart.items
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    expect(total).toBeCloseTo(13.0);
  });

  it("returns 0 for an empty cart", () => {
    const total = useCartStore.getState().cart.items
      .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    expect(total).toBe(0);
  });
});
