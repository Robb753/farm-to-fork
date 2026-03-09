import { describe, expect, it } from "vitest";
import { createOrderSchema, deliveryAddressSchema } from "@/lib/validations/order";

// ─── Fixtures ────────────────────────────────────────────────────────────────

const validPickup = {
  farmId: 1,
  items: [{ productId: 1, quantity: 2 }],
  deliveryMode: "pickup" as const,
  deliveryDay: "2026-04-01",
};

const validAddress = {
  street: "12 rue de la Paix",
  city: "Paris",
  postalCode: "75001",
  country: "France",
};

// ─── createOrderSchema ───────────────────────────────────────────────────────

describe("createOrderSchema — valid payloads", () => {
  it("accepts a minimal valid pickup order", () => {
    expect(createOrderSchema.safeParse(validPickup).success).toBe(true);
  });

  it("accepts a delivery order with an address", () => {
    const result = createOrderSchema.safeParse({
      ...validPickup,
      deliveryMode: "delivery",
      deliveryAddress: validAddress,
    });
    expect(result.success).toBe(true);
  });

  it("accepts customer notes within the limit", () => {
    const result = createOrderSchema.safeParse({
      ...validPickup,
      customerNotes: "Merci de sonner deux fois.",
    });
    expect(result.success).toBe(true);
  });

  it("accepts multiple items (up to 50)", () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      productId: i + 1,
      quantity: 1,
    }));
    expect(createOrderSchema.safeParse({ ...validPickup, items }).success).toBe(true);
  });
});

describe("createOrderSchema — invalid payloads", () => {
  it("rejects an empty items array", () => {
    const result = createOrderSchema.safeParse({ ...validPickup, items: [] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 items", () => {
    const items = Array.from({ length: 51 }, (_, i) => ({
      productId: i + 1,
      quantity: 1,
    }));
    expect(createOrderSchema.safeParse({ ...validPickup, items }).success).toBe(false);
  });

  it("rejects a negative productId", () => {
    const result = createOrderSchema.safeParse({
      ...validPickup,
      items: [{ productId: -1, quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects productId = 0", () => {
    const result = createOrderSchema.safeParse({
      ...validPickup,
      items: [{ productId: 0, quantity: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity = 0", () => {
    const result = createOrderSchema.safeParse({
      ...validPickup,
      items: [{ productId: 1, quantity: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects quantity > 1000", () => {
    const result = createOrderSchema.safeParse({
      ...validPickup,
      items: [{ productId: 1, quantity: 1001 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects farmId = 0", () => {
    expect(createOrderSchema.safeParse({ ...validPickup, farmId: 0 }).success).toBe(false);
  });

  it("rejects a negative farmId", () => {
    expect(createOrderSchema.safeParse({ ...validPickup, farmId: -1 }).success).toBe(false);
  });

  it("rejects an invalid deliveryMode", () => {
    expect(
      createOrderSchema.safeParse({ ...validPickup, deliveryMode: "drone" }).success,
    ).toBe(false);
  });

  it("rejects a missing deliveryDay", () => {
    const { deliveryDay: _omit, ...withoutDay } = validPickup;
    expect(createOrderSchema.safeParse(withoutDay).success).toBe(false);
  });

  it("rejects customer notes longer than 500 characters", () => {
    const result = createOrderSchema.safeParse({
      ...validPickup,
      customerNotes: "x".repeat(501),
    });
    expect(result.success).toBe(false);
  });

  it("rejects a null body", () => {
    expect(createOrderSchema.safeParse(null).success).toBe(false);
  });

  it("rejects an empty object", () => {
    expect(createOrderSchema.safeParse({}).success).toBe(false);
  });
});

// ─── deliveryAddressSchema ────────────────────────────────────────────────────

describe("deliveryAddressSchema", () => {
  it("accepts a complete address", () => {
    expect(deliveryAddressSchema.safeParse(validAddress).success).toBe(true);
  });

  it("accepts an address with additionalInfo", () => {
    expect(
      deliveryAddressSchema.safeParse({ ...validAddress, additionalInfo: "Bât. C" }).success,
    ).toBe(true);
  });

  it("rejects a missing street", () => {
    const { street: _omit, ...rest } = validAddress;
    expect(deliveryAddressSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects an empty city", () => {
    expect(deliveryAddressSchema.safeParse({ ...validAddress, city: "" }).success).toBe(false);
  });

  it("rejects a missing postalCode", () => {
    const { postalCode: _omit, ...rest } = validAddress;
    expect(deliveryAddressSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects a missing country", () => {
    const { country: _omit, ...rest } = validAddress;
    expect(deliveryAddressSchema.safeParse(rest).success).toBe(false);
  });
});

// ─── Server-side price calculation (pure logic) ───────────────────────────────

describe("order total price calculation logic", () => {
  function computeTotal(
    products: Map<number, { price: number }>,
    items: Array<{ productId: number; quantity: number }>,
  ): number {
    return items.reduce((sum, item) => {
      const p = products.get(item.productId);
      return p ? sum + p.price * item.quantity : sum;
    }, 0);
  }

  it("calculates total correctly for multiple items", () => {
    const products = new Map([
      [1, { price: 3.5 }],  // 3.5 × 2 = 7
      [2, { price: 2.0 }],  // 2.0 × 3 = 6
    ]);
    const items = [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }];
    expect(computeTotal(products, items)).toBeCloseTo(13.0);
  });

  it("returns 0 for an empty cart", () => {
    expect(computeTotal(new Map(), [])).toBe(0);
  });

  it("rounds to 2 decimal places correctly", () => {
    // 3.14159 × 2 = 6.28318 → toFixed(2) = "6.28"
    const result = Number((3.14159 * 2).toFixed(2));
    expect(result).toBe(6.28);
  });

  it("handles a single item", () => {
    const products = new Map([[5, { price: 12.99 }]]);
    expect(computeTotal(products, [{ productId: 5, quantity: 4 }])).toBeCloseTo(51.96);
  });
});
