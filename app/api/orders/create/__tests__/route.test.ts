/**
 * Tests for POST /api/orders/create
 *
 * Covers every security gate and business rule in the route, in order:
 *   0. CSRF / same-origin guard    (assertSameOrigin)
 *   1. Content-Type enforcement     (415)
 *   2. Authentication               (Bearer JWT, 401)
 *   3. Rate limiting                (429)
 *   4. Zod body validation          (400)
 *   5. Farm existence & active flag (404 / 400)
 *   6. Product fetch & ownership    (404 / 500)
 *   7. Stock check                  (400 / 500)
 *   8. Server-side price guard      (400 / 500)
 *   9. Delivery address requirement (400)
 *  10. DB insert errors             (500)
 *  11. Happy path                   (201)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

// ─── Module mocks (hoisted by Vitest before any import) ───────────────────

vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/api/jwt", () => ({ getJwtSub: vi.fn() }));
vi.mock("@/lib/rateLimit", () => ({
  rateLimit: vi.fn(),
  getClientIp: vi.fn().mockReturnValue("127.0.0.1"),
  RATE_LIMITS: { orders: { maxRequests: 10, windowMs: 60_000 } },
}));

// ─── Imports (resolved after mocks are in place) ───────────────────────────

import { createClient } from "@supabase/supabase-js";
import { getJwtSub } from "@/lib/api/jwt";
import { rateLimit } from "@/lib/rateLimit";
import { POST } from "@/app/api/orders/create/route";

const mockCreateClient = vi.mocked(createClient);
const mockGetJwtSub = vi.mocked(getJwtSub);
const mockRateLimit = vi.mocked(rateLimit);

// ─── Fixtures ─────────────────────────────────────────────────────────────

const VALID_TOKEN = "header.eyJzdWIiOiJ1c2VyX3Rlc3QxMjMifQ.sig";
const USER_ID = "user_test123";

/** A product returned by the DB — all fields valid. */
const dbProduct = {
  id: 10,
  name: "Tomates cerises",
  price: 3.5,
  unit: "kg",
  stock_status: "in_stock" as const,
  stock_quantity: 100,
  image_url: null,
  farm_id: 1,
};

const dbFarm = { id: 1, active: true };

/** The row Supabase returns after INSERT. */
const dbOrder = {
  id: 999,
  user_id: USER_ID,
  farm_id: 1,
  items: [{ productId: 10, productName: "Tomates cerises", price: 3.5, quantity: 2, unit: "kg" }],
  total_price: 7.0,
  delivery_mode: "pickup",
  delivery_day: "2026-04-15",
  delivery_address: null,
  customer_notes: null,
  status: "pending",
  payment_status: "unpaid",
  created_at: "2026-03-09T00:00:00Z",
  updated_at: "2026-03-09T00:00:00Z",
};

/** Minimal valid body that passes all checks. */
const validBody = {
  farmId: 1,
  items: [{ productId: 10, quantity: 2 }],
  deliveryMode: "pickup",
  deliveryDay: "2026-04-15",
};

// ─── Supabase mock factory ─────────────────────────────────────────────────

/**
 * Creates a Supabase query builder that is:
 * - chainable  : .select / .eq / .in / .insert all return `this`
 * - awaitable  : has .then() for queries NOT ending in .single()
 *                (e.g. the products SELECT)
 * - single()   : returns a Promise for queries that end with .single()
 *                (e.g. farm lookup, order insert)
 */
function makeQueryMock(response: { data: unknown; error: unknown }) {
  const q: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(response),
    // Makes `await builder` work without calling .single()
    then: (onFulfilled: (v: unknown) => unknown, onRejected: (e: unknown) => unknown) =>
      Promise.resolve(response).then(onFulfilled, onRejected),
  };
  return q;
}

type SupabaseOverrides = {
  farm?: { data: unknown; error: unknown };
  products?: { data: unknown; error: unknown };
  orderInsert?: { data: unknown; error: unknown };
};

/** Configures mockCreateClient to return a per-table query mock. */
function setupSupabase({
  farm = { data: dbFarm, error: null },
  products = { data: [dbProduct], error: null },
  orderInsert = { data: dbOrder, error: null },
}: SupabaseOverrides = {}) {
  mockCreateClient.mockReturnValue({
    from: (table: string) => {
      if (table === "listing") return makeQueryMock(farm);
      if (table === "products") return makeQueryMock(products);
      if (table === "orders") return makeQueryMock(orderInsert);
      return makeQueryMock({ data: null, error: null });
    },
  } as ReturnType<typeof createClient>);
}

// ─── Request builder ────────────────────────────────────────────────────────

/**
 * Builds a NextRequest that passes all security checks by default.
 * Override headers or body per test as needed.
 */
function makeRequest(
  body: unknown = validBody,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest("http://localhost:3000/api/orders/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      Authorization: `Bearer ${VALID_TOKEN}`,
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

// ─── Global setup ───────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
  vi.stubEnv("NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS", "false");

  mockGetJwtSub.mockReturnValue(USER_ID);
  mockRateLimit.mockReturnValue({ success: true, remaining: 9, resetAt: Date.now() + 60_000 });
  setupSupabase();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/orders/create", () => {

  // ══════════════════════════════════════════════════════════════════════════
  // 0. CSRF / same-origin guard
  // ══════════════════════════════════════════════════════════════════════════
  describe("security — CSRF / same-origin guard", () => {

    it("allows requests from http://localhost:3000 (dev default)", async () => {
      // Verifies localhost is always in the allowed-origins list
      const res = await POST(makeRequest(validBody, { Origin: "http://localhost:3000" }));
      expect(res.status).toBe(201);
    });

    it("allows requests from http://127.0.0.1:3000 (dev alias)", async () => {
      const res = await POST(makeRequest(validBody, { Origin: "http://127.0.0.1:3000" }));
      expect(res.status).toBe(201);
    });

    it("allows requests from NEXT_PUBLIC_APP_URL (production domain)", async () => {
      vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://farm2fork.fr");
      const res = await POST(makeRequest(validBody, { Origin: "https://farm2fork.fr" }));
      expect(res.status).toBe(201);
    });

    it("blocks requests from a cross-site origin", async () => {
      // An attacker's site cannot forge a request with a different origin
      const res = await POST(makeRequest(validBody, { Origin: "https://evil.com" }));
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it("blocks requests with a malformed origin that cannot be parsed as URL", async () => {
      const res = await POST(makeRequest(validBody, { Origin: "not-a-url" }));
      expect(res.status).toBe(403);
    });

    it("falls back to Referer header when Origin is absent", async () => {
      // Browsers send Referer for same-origin navigations without an Origin header
      const req = new NextRequest("http://localhost:3000/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
          Referer: "http://localhost:3000/farm/1/checkout",
          // No Origin header intentionally
        },
        body: JSON.stringify(validBody),
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });

    it("blocks requests with a cross-site Referer when Origin is absent", async () => {
      const req = new NextRequest("http://localhost:3000/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
          Referer: "https://evil.com/phishing",
        },
        body: JSON.stringify(validBody),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("blocks requests with no Origin AND no Referer in production", async () => {
      // In prod, every browser request includes at least one of these headers;
      // absence suggests a direct curl/scripted call from another origin
      vi.stubEnv("NODE_ENV", "production");
      const req = new NextRequest("http://localhost:3000/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${VALID_TOKEN}`,
          // No Origin, no Referer
        },
        body: JSON.stringify(validBody),
      });
      const res = await POST(req);
      expect(res.status).toBe(403);
    });

    it("allows *.vercel.app origins when NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS=true", async () => {
      vi.stubEnv("NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS", "true");
      const res = await POST(
        makeRequest(validBody, { Origin: "https://myapp-git-main-abc123.vercel.app" }),
      );
      expect(res.status).toBe(201);
    });

    it("blocks *.vercel.app origins when NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS=false", async () => {
      // Default: previews disabled — wildcard must be opt-in
      const res = await POST(
        makeRequest(validBody, { Origin: "https://myapp-git-main-abc123.vercel.app" }),
      );
      expect(res.status).toBe(403);
    });

    it("blocks http:// vercel.app origins even when previews are enabled (must be https)", async () => {
      vi.stubEnv("NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS", "true");
      const res = await POST(
        makeRequest(validBody, { Origin: "http://myapp.vercel.app" }),
      );
      expect(res.status).toBe(403);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 1. Content-Type
  // ══════════════════════════════════════════════════════════════════════════
  describe("validation — Content-Type", () => {

    it("returns 415 when Content-Type header is absent", async () => {
      const req = new NextRequest("http://localhost:3000/api/orders/create", {
        method: "POST",
        headers: {
          Origin: "http://localhost:3000",
          Authorization: `Bearer ${VALID_TOKEN}`,
          // No Content-Type
        },
        body: JSON.stringify(validBody),
      });
      const res = await POST(req);
      expect(res.status).toBe(415);
      expect((await res.json()).success).toBe(false);
    });

    it("returns 415 when Content-Type is text/plain", async () => {
      const res = await POST(makeRequest(validBody, { "Content-Type": "text/plain" }));
      expect(res.status).toBe(415);
    });

    it("returns 415 when Content-Type is multipart/form-data", async () => {
      const res = await POST(makeRequest(validBody, { "Content-Type": "multipart/form-data" }));
      expect(res.status).toBe(415);
    });

    it("accepts application/json with a charset suffix", async () => {
      // application/json; charset=utf-8 is a common browser Content-Type
      const res = await POST(
        makeRequest(validBody, { "Content-Type": "application/json; charset=utf-8" }),
      );
      expect(res.status).toBe(201);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 2. Authentication
  // ══════════════════════════════════════════════════════════════════════════
  describe("security — authentication", () => {

    it("returns 401 when the Authorization header is missing", async () => {
      const req = new NextRequest("http://localhost:3000/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          // No Authorization
        },
        body: JSON.stringify(validBody),
      });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Non authentifié");
    });

    it("returns 401 when Authorization uses Basic instead of Bearer", async () => {
      const res = await POST(makeRequest(validBody, { Authorization: "Basic dXNlcjpwYXNz" }));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Non authentifié");
    });

    it("returns 401 when the JWT has no sub claim (getJwtSub returns null)", async () => {
      // This covers tampered or expired tokens where sub is missing
      mockGetJwtSub.mockReturnValue(null);
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe("Token invalide (sub manquant)");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 3. Rate limiting
  // ══════════════════════════════════════════════════════════════════════════
  describe("security — rate limiting", () => {

    it("returns 429 with Retry-After when the user's quota is exhausted", async () => {
      mockRateLimit.mockReturnValue({ success: false, remaining: 0, resetAt: Date.now() + 30_000 });

      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(429);
      expect(body.success).toBe(false);
      // Retry-After must be present so clients can back off
      expect(res.headers.get("Retry-After")).toBeDefined();
    });

    it("scopes the rate-limit key to the authenticated userId, not the IP", async () => {
      // Prevents IP-based bypass via proxies; each user has their own bucket
      await POST(makeRequest());

      expect(mockRateLimit).toHaveBeenCalledWith(
        `orders:${USER_ID}`,
        expect.objectContaining({ maxRequests: expect.any(Number), windowMs: expect.any(Number) }),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 4. Zod body validation
  // ══════════════════════════════════════════════════════════════════════════
  describe("validation — request body (Zod)", () => {

    it("returns 400 for non-JSON body (parse error caught by .catch(() => null))", async () => {
      const req = new NextRequest("http://localhost:3000/api/orders/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3000",
          Authorization: `Bearer ${VALID_TOKEN}`,
        },
        body: "{ not json !!!",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 for a null body and includes field-level details", async () => {
      const res = await POST(makeRequest(null));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(Array.isArray(body.details)).toBe(true);
      expect(body.details.length).toBeGreaterThan(0);
    });

    it("returns 400 when farmId is missing", async () => {
      const { farmId: _omit, ...noFarmId } = validBody;
      const res = await POST(makeRequest(noFarmId));
      expect(res.status).toBe(400);
    });

    it("returns 400 when farmId is 0 (not a positive integer)", async () => {
      const res = await POST(makeRequest({ ...validBody, farmId: 0 }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when items is an empty array", async () => {
      const res = await POST(makeRequest({ ...validBody, items: [] }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when an item has quantity = 0", async () => {
      const res = await POST(makeRequest({ ...validBody, items: [{ productId: 10, quantity: 0 }] }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when an item has a negative productId", async () => {
      const res = await POST(makeRequest({ ...validBody, items: [{ productId: -1, quantity: 1 }] }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when items exceeds the 50-item limit", async () => {
      const items = Array.from({ length: 51 }, (_, i) => ({ productId: i + 1, quantity: 1 }));
      const res = await POST(makeRequest({ ...validBody, items }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when deliveryMode is an unsupported value", async () => {
      const res = await POST(makeRequest({ ...validBody, deliveryMode: "drone" }));
      expect(res.status).toBe(400);
    });

    it("returns 400 when deliveryDay is missing", async () => {
      const { deliveryDay: _omit, ...noDay } = validBody;
      const res = await POST(makeRequest(noDay));
      expect(res.status).toBe(400);
    });

    it("returns 400 when customerNotes exceeds 500 characters", async () => {
      const res = await POST(makeRequest({ ...validBody, customerNotes: "x".repeat(501) }));
      expect(res.status).toBe(400);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 5. Farm check
  // ══════════════════════════════════════════════════════════════════════════
  describe("business logic — farm", () => {

    it("returns 404 when Supabase returns an error for the farm query", async () => {
      setupSupabase({ farm: { data: null, error: { message: "not found" } } });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("Ferme introuvable");
    });

    it("returns 404 when Supabase returns null data with no error (row missing)", async () => {
      setupSupabase({ farm: { data: null, error: null } });
      const res = await POST(makeRequest());
      expect(res.status).toBe(404);
    });

    it("returns 400 when the farm exists but is inactive (active = false)", async () => {
      // An inactive farm must not accept new orders
      setupSupabase({ farm: { data: { id: 1, active: false }, error: null } });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Ferme non disponible");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 6. Product fetch & ownership
  // ══════════════════════════════════════════════════════════════════════════
  describe("business logic — products", () => {

    it("returns 500 when Supabase returns a DB error while fetching products", async () => {
      setupSupabase({ products: { data: null, error: { message: "connection timeout" } } });
      const res = await POST(makeRequest());
      expect(res.status).toBe(500);
    });

    it("returns 404 when the product list is empty (products not published or inactive)", async () => {
      setupSupabase({ products: { data: [], error: null } });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("Aucun produit trouvé");
    });

    it("returns 404 when a requested productId is not present in DB results", async () => {
      // Client requests product 10 but DB returns product 99 (different farm or deleted)
      setupSupabase({ products: { data: [{ ...dbProduct, id: 99 }], error: null } });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toContain("introuvables");
      expect(body.details[0]).toContain("10"); // missing product ID in details
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 7. Stock check
  // ══════════════════════════════════════════════════════════════════════════
  describe("business logic — stock check", () => {

    it("returns 400 when a product is out_of_stock", async () => {
      setupSupabase({
        products: { data: [{ ...dbProduct, stock_status: "out_of_stock" }], error: null },
      });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("Stock insuffisant");
      expect(body.details).toContain("Produit en rupture de stock");
    });

    it("returns 400 when stock_quantity < requested quantity", async () => {
      // Product has 1 unit, client requests 2 — should be blocked
      setupSupabase({
        products: { data: [{ ...dbProduct, stock_quantity: 1, stock_status: "low_stock" }], error: null },
      });
      const res = await POST(makeRequest({ ...validBody, items: [{ productId: 10, quantity: 2 }] }));
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.details[0]).toContain("Disponible: 1, demandé: 2");
    });

    it("allows the order when stock_quantity exactly equals the requested quantity", async () => {
      // Edge case: available = requested is valid (boundary condition)
      setupSupabase({
        products: { data: [{ ...dbProduct, stock_quantity: 2 }], error: null },
      });
      const res = await POST(makeRequest({ ...validBody, items: [{ productId: 10, quantity: 2 }] }));
      expect(res.status).toBe(201);
    });

    it("allows the order when stock_quantity is null (MVP: treat as unlimited)", async () => {
      // null means the farmer has not configured stock tracking — MVP allows it
      setupSupabase({
        products: { data: [{ ...dbProduct, stock_quantity: null }], error: null },
      });
      const res = await POST(makeRequest());
      expect(res.status).toBe(201);
    });

    it("returns 500 when stock_quantity is a negative number (data integrity issue)", async () => {
      setupSupabase({
        products: { data: [{ ...dbProduct, stock_quantity: -5 }], error: null },
      });
      const res = await POST(makeRequest());
      expect(res.status).toBe(500);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 8. Server-side price guard
  // ══════════════════════════════════════════════════════════════════════════
  describe("business logic — server-side price calculation", () => {

    it("returns 500 when a product has no price (null in DB)", async () => {
      // A null price is a data-integrity issue — must not create an order with 0 total
      setupSupabase({
        products: { data: [{ ...dbProduct, price: null }], error: null },
      });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("Prix manquant");
    });

    it("returns 400 when a product price is 0 (free products are not allowed)", async () => {
      setupSupabase({
        products: { data: [{ ...dbProduct, price: 0 }], error: null },
      });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain("Prix invalide");
    });

    it("returns 400 when a product price is negative", async () => {
      setupSupabase({
        products: { data: [{ ...dbProduct, price: -2.5 }], error: null },
      });
      const res = await POST(makeRequest());
      expect(res.status).toBe(400);
    });

    it("returns 500 when a product has no unit", async () => {
      // Unit is required to build the order item snapshot
      setupSupabase({
        products: { data: [{ ...dbProduct, unit: null }], error: null },
      });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toContain("Unité manquante");
    });

    it("uses the DB price to compute total, ignoring any client-supplied price field", async () => {
      // Security: client can never tamper with the price; route always fetches from DB
      const payloadWithFakeTotal = { ...validBody, totalPrice: 0.01 }; // ignored
      setupSupabase({
        products: { data: [{ ...dbProduct, price: 3.5 }], error: null },
        orderInsert: { data: { ...dbOrder, total_price: 7.0 }, error: null }, // 3.5 × 2
      });

      const res = await POST(makeRequest(payloadWithFakeTotal));
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.order.total_price).toBe(7.0);
    });

    it("rounds total_price to 2 decimal places before inserting", async () => {
      // 1.005 × 3 = 3.015 → should be stored as 3.02 (via toFixed(2))
      setupSupabase({
        products: { data: [{ ...dbProduct, price: 1.005 }], error: null },
        orderInsert: { data: { ...dbOrder, total_price: 3.02 }, error: null },
      });

      const res = await POST(makeRequest({ ...validBody, items: [{ productId: 10, quantity: 3 }] }));
      expect(res.status).toBe(201);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 9. Delivery address
  // ══════════════════════════════════════════════════════════════════════════
  describe("business logic — delivery address", () => {

    it("returns 400 when mode is 'delivery' but no address is provided", async () => {
      const res = await POST(
        makeRequest({ ...validBody, deliveryMode: "delivery" /* no deliveryAddress */ }),
      );
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Adresse de livraison requise pour ce mode");
    });

    it("does NOT require an address for 'pickup' mode", async () => {
      const res = await POST(makeRequest({ ...validBody, deliveryMode: "pickup" }));
      expect(res.status).toBe(201);
    });

    it("returns 201 for a valid delivery order with a complete address", async () => {
      const res = await POST(
        makeRequest({
          ...validBody,
          deliveryMode: "delivery",
          deliveryAddress: {
            street: "12 rue de la Paix",
            city: "Paris",
            postalCode: "75001",
            country: "France",
          },
        }),
      );
      expect(res.status).toBe(201);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 10. DB insert errors
  // ══════════════════════════════════════════════════════════════════════════
  describe("database — insert errors", () => {

    it("returns 500 when the INSERT returns a Supabase error (e.g. RLS violation)", async () => {
      setupSupabase({ orderInsert: { data: null, error: { message: "RLS policy violation" } } });
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Erreur lors de la création de la commande");
    });

    it("returns 500 when INSERT returns null data with no error (unexpected DB state)", async () => {
      setupSupabase({ orderInsert: { data: null, error: null } });
      const res = await POST(makeRequest());
      expect(res.status).toBe(500);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 11. Happy path
  // ══════════════════════════════════════════════════════════════════════════
  describe("success cases", () => {

    it("returns 201 with success=true and the created order", async () => {
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(res.status).toBe(201);
      expect(body.success).toBe(true);
      expect(body.order).toBeDefined();
      expect(body.order.id).toBe(999);
    });

    it("sets status='pending' and payment_status='unpaid' on the inserted order", async () => {
      // These are business invariants: new orders are always pending and unpaid
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(body.order.status).toBe("pending");
      expect(body.order.payment_status).toBe("unpaid");
    });

    it("stores the authenticated userId (from JWT sub) as user_id, not from the body", async () => {
      // Security: user_id is taken from the verified JWT, never from the request body
      const res = await POST(makeRequest());
      const body = await res.json();

      expect(body.order.user_id).toBe(USER_ID);
    });

    it("accepts optional customerNotes without error", async () => {
      const res = await POST(
        makeRequest({ ...validBody, customerNotes: "Sonner deux fois, merci." }),
      );
      expect(res.status).toBe(201);
    });

    it("accepts a multi-item order", async () => {
      const p2 = { ...dbProduct, id: 20, name: "Carottes", price: 2.0 };
      setupSupabase({
        products: { data: [dbProduct, p2], error: null },
        orderInsert: { data: { ...dbOrder, total_price: 11.0 }, error: null }, // 7 + 4
      });
      const res = await POST(
        makeRequest({
          ...validBody,
          items: [{ productId: 10, quantity: 2 }, { productId: 20, quantity: 2 }],
        }),
      );
      expect(res.status).toBe(201);
    });
  });
});
