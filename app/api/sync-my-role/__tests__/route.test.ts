/**
 * Tests for POST /api/sync-my-role
 *
 * The route has exactly 5 sequential gates — every test targets one:
 *
 *   Gate 1 · Clerk session        auth() → userId present?
 *   Gate 2 · Server config        SUPABASE_URL + SERVICE_ROLE_KEY set?
 *   Gate 3 · Supabase role read   profiles.role exists and is trusted?
 *   Gate 4 · Role validation      role ∈ ALLOWED_ROLES ("user"|"farmer"|"admin")?
 *   Gate 5 · Clerk write          clerkClient().users.updateUser(userId, …) succeeds?
 *
 * Security invariants verified explicitly:
 *   · Role always comes from Supabase (source of truth), never from the request
 *   · updateUser is called with the session userId, not any client-supplied value
 *   · publicMetadata is set to exactly { role } — nothing else is overwritten
 *   · Service-role key is used for the Supabase client (bypasses RLS)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Module mocks (hoisted before imports) ────────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

// ─── Imports (resolved after mocks) ──────────────────────────────────────

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { POST } from "@/app/api/sync-my-role/route";

const mockAuth = vi.mocked(auth);
const mockClerkClient = vi.mocked(clerkClient);
const mockCreateClient = vi.mocked(createClient);

// ─── Fixtures ─────────────────────────────────────────────────────────────

const USER_ID = "user_clerk_abc123";

// ─── Mock factories ───────────────────────────────────────────────────────

/**
 * Creates a Supabase client mock whose .from("profiles") chain
 * ends with .maybeSingle() returning the given response.
 *
 * Chain shape in the route:
 *   supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle()
 */
function makeSupabaseMock(profileResult: { data: unknown; error: unknown }) {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(profileResult),
  };
  return { from: vi.fn().mockReturnValue(queryBuilder) };
}

/** Returns the inner query builder created by makeSupabaseMock, for call assertions. */
function getQueryBuilder() {
  // mockCreateClient was called once; its return value is our mock supabase client.
  return (mockCreateClient.mock.results[0]?.value as ReturnType<typeof makeSupabaseMock>)
    ?.from.mock.results[0]?.value;
}

// ─── Default updateUser spy (swapped per-test when needed) ────────────────

let mockUpdateUser: ReturnType<typeof vi.fn>;

// ─── Global setup ─────────────────────────────────────────────────────────

beforeEach(() => {
  // Environment
  vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");

  // Clerk session — authenticated user by default
  mockAuth.mockResolvedValue({ userId: USER_ID } as Awaited<ReturnType<typeof auth>>);

  // Clerk client — updateUser succeeds by default
  mockUpdateUser = vi.fn().mockResolvedValue({});
  mockClerkClient.mockResolvedValue({
    users: { updateUser: mockUpdateUser },
  } as unknown as Awaited<ReturnType<typeof clerkClient>>);

  // Supabase — profile with "user" role by default
  mockCreateClient.mockReturnValue(
    makeSupabaseMock({ data: { role: "user" }, error: null }) as ReturnType<typeof createClient>,
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────

describe("POST /api/sync-my-role", () => {

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 1 — Clerk session / authentication
  // ══════════════════════════════════════════════════════════════════════════
  describe("security — authentication (Gate 1)", () => {

    it("returns 401 when auth() yields no userId (unauthenticated session)", async () => {
      mockAuth.mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Non authentifié");
    });

    it("does not reach Supabase or Clerk when userId is absent", async () => {
      // Verify short-circuit: no DB call, no Clerk write on unauthenticated requests
      mockAuth.mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      await POST();

      expect(mockCreateClient).not.toHaveBeenCalled();
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 2 — Server configuration
  // ══════════════════════════════════════════════════════════════════════════
  describe("security — server configuration (Gate 2)", () => {

    it("returns 500 when SUPABASE_URL is missing", async () => {
      vi.stubEnv("SUPABASE_URL", "");

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Configuration serveur manquante");
    });

    it("returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Configuration serveur manquante");
    });

    it("returns 500 when both Supabase env vars are missing", async () => {
      vi.stubEnv("SUPABASE_URL", "");
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      const res = await POST();

      expect(res.status).toBe(500);
    });

    it("does not attempt a Supabase query when env vars are absent", async () => {
      vi.stubEnv("SUPABASE_URL", "");

      await POST();

      // createClient itself must not be called with empty/undefined credentials
      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it("creates the Supabase client using the SERVICE_ROLE_KEY (not the anon key)", async () => {
      // The service role key is required to bypass RLS on the profiles table
      await POST();

      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-service-role-key",
        expect.objectContaining({ auth: expect.any(Object) }),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 3 — Supabase role lookup
  // ══════════════════════════════════════════════════════════════════════════
  describe("supabase — role lookup (Gate 3)", () => {

    it("returns 404 when Supabase returns a query error", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: null, error: { message: "connection refused" } }) as ReturnType<typeof createClient>,
      );

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Profil introuvable");
    });

    it("returns 404 when the profile row does not exist (maybeSingle → null)", async () => {
      // maybeSingle() returns { data: null, error: null } when no row matches
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: null, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body.error).toBe("Profil introuvable");
    });

    it("queries profiles filtered by the authenticated userId, not any external input", async () => {
      // Security: userId must come from auth(), never from the request body
      await POST();

      const qb = getQueryBuilder();
      expect(qb.eq).toHaveBeenCalledWith("user_id", USER_ID);
    });

    it("selects only the 'role' column (minimal data exposure)", async () => {
      await POST();

      const qb = getQueryBuilder();
      expect(qb.select).toHaveBeenCalledWith("role");
    });

    it("does not call Clerk updateUser when the profile is missing", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: null, error: null }) as ReturnType<typeof createClient>,
      );

      await POST();

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 4 — Role validation (allowlist)
  // ══════════════════════════════════════════════════════════════════════════
  describe("security — role validation (Gate 4)", () => {

    it("returns 400 when profile.role is null (unset in DB)", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: null }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Rôle invalide en base de données");
    });

    it("returns 400 when profile.role is an empty string", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "" }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();

      expect(res.status).toBe(400);
    });

    it("returns 400 for an unknown role value ('superadmin')", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "superadmin" }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toBe("Rôle invalide en base de données");
    });

    it("returns 400 for an uppercase role ('ADMIN') — allowlist is case-sensitive", async () => {
      // Prevents case-folding bypasses; only lowercase values are allowed
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "ADMIN" }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();

      expect(res.status).toBe(400);
    });

    it("returns 400 for a role with whitespace padding ('  user  ')", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "  user  " }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();

      expect(res.status).toBe(400);
    });

    it("does not call Clerk updateUser when the role is invalid", async () => {
      // Invalid role must be blocked before any write to Clerk
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "hacker" }, error: null }) as ReturnType<typeof createClient>,
      );

      await POST();

      expect(mockUpdateUser).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 5 — Clerk write
  // ══════════════════════════════════════════════════════════════════════════
  describe("clerk — updateUser behavior (Gate 5)", () => {

    it("returns 500 when clerkClient() factory itself throws", async () => {
      mockClerkClient.mockRejectedValue(new Error("Clerk SDK unavailable"));

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.success).toBe(false);
      expect(body.error).toBe("Impossible de synchroniser le rôle Clerk");
    });

    it("returns 500 when updateUser() throws (e.g. Clerk API rate limit)", async () => {
      mockUpdateUser.mockRejectedValue(new Error("429 Too Many Requests"));
      mockClerkClient.mockResolvedValue({
        users: { updateUser: mockUpdateUser },
      } as unknown as Awaited<ReturnType<typeof clerkClient>>);

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe("Impossible de synchroniser le rôle Clerk");
    });

    it("calls updateUser with the session userId, not any value from the request", async () => {
      // Core security invariant: the target of the Clerk update is the authenticated user
      await POST();

      expect(mockUpdateUser).toHaveBeenCalledWith(
        USER_ID,
        expect.any(Object),
      );
    });

    it("sets publicMetadata to exactly { role } — no other metadata fields are touched", async () => {
      // Prevents accidental overwrite of other metadata (e.g. isAdmin flags, Stripe IDs)
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "farmer" }, error: null }) as ReturnType<typeof createClient>,
      );

      await POST();

      expect(mockUpdateUser).toHaveBeenCalledWith(USER_ID, {
        publicMetadata: { role: "farmer" },
      });
    });

    it("propagates the exact role string from DB to Clerk (no transformation)", async () => {
      for (const role of ["user", "farmer", "admin"] as const) {
        vi.clearAllMocks();
        mockUpdateUser = vi.fn().mockResolvedValue({});
        mockClerkClient.mockResolvedValue({
          users: { updateUser: mockUpdateUser },
        } as unknown as Awaited<ReturnType<typeof clerkClient>>);
        mockCreateClient.mockReturnValue(
          makeSupabaseMock({ data: { role }, error: null }) as ReturnType<typeof createClient>,
        );

        await POST();

        expect(mockUpdateUser).toHaveBeenCalledWith(USER_ID, {
          publicMetadata: { role },
        });
      }
    });

    it("calls updateUser exactly once per request (no duplicate writes)", async () => {
      await POST();

      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Happy path — response shape and content
  // ══════════════════════════════════════════════════════════════════════════
  describe("happy path", () => {

    it("returns 200 with { success: true, role } for a 'user' profile", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "user" }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, role: "user" });
    });

    it("returns 200 with { success: true, role } for a 'farmer' profile", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "farmer" }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, role: "farmer" });
    });

    it("returns 200 with { success: true, role } for an 'admin' profile", async () => {
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "admin" }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, role: "admin" });
    });

    it("response role matches the Supabase value, not any pre-existing Clerk metadata", async () => {
      // If Clerk metadata is stale, the response still reflects the DB truth
      mockCreateClient.mockReturnValue(
        makeSupabaseMock({ data: { role: "admin" }, error: null }) as ReturnType<typeof createClient>,
      );

      const res = await POST();
      const body = await res.json();

      // Role in the response = what was read from DB
      expect(body.role).toBe("admin");
    });

    it("is idempotent: calling twice returns the same result without error", async () => {
      mockCreateClient
        .mockReturnValueOnce(
          makeSupabaseMock({ data: { role: "farmer" }, error: null }) as ReturnType<typeof createClient>,
        )
        .mockReturnValueOnce(
          makeSupabaseMock({ data: { role: "farmer" }, error: null }) as ReturnType<typeof createClient>,
        );

      const res1 = await POST();
      const res2 = await POST();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect((await res2.json()).role).toBe("farmer");
    });
  });
});
