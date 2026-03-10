/**
 * Tests for POST /api/sync-my-role
 *
 * The route has 5 sequential gates — failure at any gate short-circuits everything
 * downstream. Tests are ordered and named to make that contract explicit.
 *
 * Gate 1 · Clerk session auth      auth() → userId truthy?
 * Gate 2 · Server config           SUPABASE_URL + SERVICE_ROLE_KEY present?
 * Gate 3 · DB read                 profiles row found, no query error?
 * Gate 4 · Role validation         role ∈ ["user","farmer","admin"]?
 * Gate 5 · Clerk write             clerkClient().users.updateUser() succeeds?
 * Gate 6 · Happy path              { success: true, role }
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Module mocks (hoisted before all imports) ─────────────────────────────

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

// ─── Imports ──────────────────────────────────────────────────────────────

import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { POST } from "@/app/api/sync-my-role/route";

const mockAuth = vi.mocked(auth);
const mockClerkClient = vi.mocked(clerkClient);
const mockCreateClient = vi.mocked(createClient);

// ─── Fixtures ─────────────────────────────────────────────────────────────

const USER_ID = "user_clerk_abc123";

// ─── Mock factory ─────────────────────────────────────────────────────────

/**
 * The route's Supabase query chain:
 *   supabase.from("profiles").select("role").eq("user_id", userId).maybeSingle()
 *
 * We capture the query builder so tests can assert on .select() and .eq() calls.
 */
let capturedQueryBuilder: {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
};

function makeSupabaseMock(profileResult: { data: unknown; error: unknown }) {
  capturedQueryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(profileResult),
  };
  return { from: vi.fn().mockReturnValue(capturedQueryBuilder) } as ReturnType<typeof createClient>;
}

function setupSupabase(profileResult: { data: unknown; error: unknown }) {
  mockCreateClient.mockReturnValue(makeSupabaseMock(profileResult));
}

// ─── Shared Clerk spy ──────────────────────────────────────────────────────

let mockUpdateUser: ReturnType<typeof vi.fn>;

// ─── Global setup ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");

  // Default: authenticated user
  mockAuth.mockResolvedValue({ userId: USER_ID } as Awaited<ReturnType<typeof auth>>);

  // Default: Clerk write succeeds
  mockUpdateUser = vi.fn().mockResolvedValue({});
  mockClerkClient.mockResolvedValue({
    users: { updateUser: mockUpdateUser },
  } as unknown as Awaited<ReturnType<typeof clerkClient>>);

  // Default: valid profile with role "user"
  setupSupabase({ data: { role: "user" }, error: null });
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
  describe("Gate 1 — authentication", () => {

    it("returns 401 when auth() resolves with userId = null", async () => {
      // Nominal Clerk case for unauthenticated sessions
      mockAuth.mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body).toEqual({ success: false, error: "Non authentifié" });
    });

    it("returns 401 when auth() resolves with userId = undefined", async () => {
      // Defensive: documents that any falsy userId is rejected, not just null
      mockAuth.mockResolvedValue({ userId: undefined } as Awaited<ReturnType<typeof auth>>);

      const res = await POST();

      expect(res.status).toBe(401);
    });

    it("does NOT call createClient when userId is absent", async () => {
      // DB must not be reached before auth is confirmed
      mockAuth.mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      await POST();

      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it("does NOT call clerkClient when userId is absent", async () => {
      // Clerk write must not be reached before auth is confirmed
      mockAuth.mockResolvedValue({ userId: null } as Awaited<ReturnType<typeof auth>>);

      await POST();

      expect(mockClerkClient).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 2 — Server configuration
  // ══════════════════════════════════════════════════════════════════════════
  describe("Gate 2 — server configuration", () => {

    it("returns 500 when SUPABASE_URL is missing", async () => {
      vi.stubEnv("SUPABASE_URL", "");

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ success: false, error: "Configuration serveur manquante" });
    });

    it("returns 500 when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ success: false, error: "Configuration serveur manquante" });
    });

    it("returns 500 when both Supabase env vars are missing", async () => {
      vi.stubEnv("SUPABASE_URL", "");
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      const res = await POST();

      expect(res.status).toBe(500);
    });

    it("does NOT call createClient when env vars are absent", async () => {
      // Must not attempt to build a client with empty credentials
      vi.stubEnv("SUPABASE_URL", "");

      await POST();

      expect(mockCreateClient).not.toHaveBeenCalled();
    });

    it("does NOT call clerkClient when env vars are absent", async () => {
      vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

      await POST();

      expect(mockClerkClient).not.toHaveBeenCalled();
    });

    it("creates the Supabase client with SERVICE_ROLE_KEY, not the anon key", async () => {
      // Service role key is required to bypass RLS on the profiles table
      await POST();

      expect(mockCreateClient).toHaveBeenCalledWith(
        "https://test.supabase.co",
        "test-service-role-key",
        expect.objectContaining({ auth: expect.any(Object) }),
      );
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 3 — Supabase DB read
  // ══════════════════════════════════════════════════════════════════════════
  describe("Gate 3 — database read", () => {

    it("returns 404 when Supabase returns a query error", async () => {
      // Covers network failures, RLS violations, schema mismatches
      setupSupabase({ data: null, error: { message: "connection refused" } });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({ success: false, error: "Profil introuvable" });
    });

    it("returns 404 when maybeSingle() returns null data with no error (row absent)", async () => {
      // maybeSingle() returns { data: null, error: null } when no row matches —
      // distinct from a DB error, but the route treats both as "profile not found"
      setupSupabase({ data: null, error: null });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(404);
      expect(body).toEqual({ success: false, error: "Profil introuvable" });
    });

    it("does NOT call clerkClient when the profile is missing", async () => {
      // A missing profile must never trigger a Clerk write
      setupSupabase({ data: null, error: null });

      await POST();

      expect(mockClerkClient).not.toHaveBeenCalled();
    });

    it("filters the query by the session userId — never by an external input", async () => {
      // Security: userId comes exclusively from auth(), the POST() fn takes no arguments
      await POST();

      expect(capturedQueryBuilder.eq).toHaveBeenCalledWith("user_id", USER_ID);
    });

    it("selects only the 'role' column (minimal data exposure)", async () => {
      await POST();

      expect(capturedQueryBuilder.select).toHaveBeenCalledWith("role");
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 4 — Role validation
  // ══════════════════════════════════════════════════════════════════════════
  describe("Gate 4 — role validation", () => {

    it("returns 400 when profile.role is null", async () => {
      // Unset role in DB must not be synced to Clerk
      setupSupabase({ data: { role: null }, error: null });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ success: false, error: "Rôle invalide en base de données" });
    });

    it("returns 400 when profile.role is an empty string", async () => {
      setupSupabase({ data: { role: "" }, error: null });

      const res = await POST();

      expect(res.status).toBe(400);
    });

    it("returns 400 for an unknown role value ('superadmin')", async () => {
      // Any value not in the explicit allowlist is rejected
      setupSupabase({ data: { role: "superadmin" }, error: null });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body).toEqual({ success: false, error: "Rôle invalide en base de données" });
    });

    it("returns 400 for an uppercase role ('ADMIN') — allowlist check is case-sensitive", async () => {
      // ALLOWED_ROLES.includes() is strict: "ADMIN" !== "admin"
      // Prevents case-folding bypass from bad DB imports or migrations
      setupSupabase({ data: { role: "ADMIN" }, error: null });

      const res = await POST();

      expect(res.status).toBe(400);
    });

    it("returns 400 for a whitespace-padded role ('  user  ')", async () => {
      // No implicit trim — only exact allowlist values are accepted
      setupSupabase({ data: { role: "  user  " }, error: null });

      const res = await POST();

      expect(res.status).toBe(400);
    });

    it("does NOT call clerkClient when the role is invalid", async () => {
      // An invalid role must be fully blocked before any write to Clerk
      setupSupabase({ data: { role: "hacker" }, error: null });

      await POST();

      expect(mockClerkClient).not.toHaveBeenCalled();
    });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 5 — Clerk write
  // ══════════════════════════════════════════════════════════════════════════
  describe("Gate 5 — Clerk write", () => {

    it("returns 500 when clerkClient() factory throws (SDK unavailable)", async () => {
      // The factory itself can fail before updateUser is even reached
      mockClerkClient.mockRejectedValue(new Error("Clerk SDK unavailable"));

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ success: false, error: "Impossible de synchroniser le rôle Clerk" });
    });

    it("returns 500 when updateUser() throws (e.g. Clerk API rate limit)", async () => {
      // updateUser fails after the client is obtained — distinct failure point
      mockUpdateUser.mockRejectedValue(new Error("429 Too Many Requests"));

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body).toEqual({ success: false, error: "Impossible de synchroniser le rôle Clerk" });
    });

    it("calls updateUser with the session userId, not any client-supplied value", async () => {
      // The target of the Clerk update must be the authenticated user only
      await POST();

      expect(mockUpdateUser).toHaveBeenCalledWith(USER_ID, expect.any(Object));
    });

    it("sets publicMetadata to exactly { role } — no other fields added or overwritten", async () => {
      // Prevents accidental overwrite of other metadata (Stripe IDs, feature flags, etc.)
      setupSupabase({ data: { role: "farmer" }, error: null });

      await POST();

      expect(mockUpdateUser).toHaveBeenCalledWith(USER_ID, {
        publicMetadata: { role: "farmer" },
      });
    });

    it("calls updateUser exactly once per request (no duplicate writes)", async () => {
      await POST();

      expect(mockUpdateUser).toHaveBeenCalledTimes(1);
    });

    it.each(["user", "farmer", "admin"] as const)(
      "propagates role '%s' from DB to Clerk without transformation",
      async (role) => {
        // Each role uses a fresh updateUser spy to avoid cross-iteration interference
        const localUpdateUser = vi.fn().mockResolvedValue({});
        mockClerkClient.mockResolvedValue({
          users: { updateUser: localUpdateUser },
        } as unknown as Awaited<ReturnType<typeof clerkClient>>);
        setupSupabase({ data: { role }, error: null });

        await POST();

        expect(localUpdateUser).toHaveBeenCalledWith(USER_ID, {
          publicMetadata: { role },
        });
      },
    );
  });

  // ══════════════════════════════════════════════════════════════════════════
  // Gate 6 — Happy path
  // ══════════════════════════════════════════════════════════════════════════
  describe("Gate 6 — happy path", () => {

    it("returns 200 with { success: true, role: 'user' }", async () => {
      setupSupabase({ data: { role: "user" }, error: null });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, role: "user" });
    });

    it("returns 200 with { success: true, role: 'farmer' }", async () => {
      setupSupabase({ data: { role: "farmer" }, error: null });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, role: "farmer" });
    });

    it("returns 200 with { success: true, role: 'admin' }", async () => {
      setupSupabase({ data: { role: "admin" }, error: null });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true, role: "admin" });
    });

    it("response role reflects the DB value, not any pre-existing Clerk metadata", async () => {
      // Clerk is the destination, not the source; the DB is always authoritative
      setupSupabase({ data: { role: "admin" }, error: null });

      const res = await POST();
      const body = await res.json();

      expect(body.role).toBe("admin");
    });

    it("is idempotent — two calls each complete with 200 and updateUser is called once per call", async () => {
      // Documents that a client retry triggers a full re-sync, not a cached result
      mockCreateClient
        .mockReturnValueOnce(makeSupabaseMock({ data: { role: "farmer" }, error: null }))
        .mockReturnValueOnce(makeSupabaseMock({ data: { role: "farmer" }, error: null }));

      const res1 = await POST();
      const res2 = await POST();

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect((await res2.json()).role).toBe("farmer");
      // updateUser must have been called once per POST(), not zero or more
      expect(mockUpdateUser).toHaveBeenCalledTimes(2);
    });
  });
});
