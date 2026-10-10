import { describe, expect, it } from "vitest";
import { validateEnvironment } from "../environment.mjs";
import { compareSchema, readCodeContract } from "../check-schema.mjs";

const anonKey = `header.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`;
const buildEnv = {
  NEXT_PUBLIC_APP_URL: "https://farm2fork.fr",
  NEXT_PUBLIC_SITE_URL: "https://farm2fork.fr",
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from("example.clerk.accounts.dev$").toString("base64")}`,
  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: "pk.example",
};

describe("environment preflight", () => {
  it("accepts build configuration without server secrets", () => {
    expect(validateEnvironment(buildEnv).errors).toEqual([]);
  });
  it("requires server secrets for runtime", () => {
    expect(validateEnvironment(buildEnv, true).errors).toContain("CLERK_SECRET_KEY: missing");
  });
  it.each([
    "sb_secret_DO_NOT_PRINT",
    `header.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.DO_NOT_PRINT`,
  ])("rejects a privileged public key without echoing it", (key) => {
    const result = validateEnvironment({ ...buildEnv, NEXT_PUBLIC_SUPABASE_ANON_KEY: key });
    expect(result.errors.length).toBeGreaterThan(0);
    expect(JSON.stringify(result)).not.toContain("DO_NOT_PRINT");
  });
  it("rejects cross-project public/server URLs", () => {
    expect(validateEnvironment({ ...buildEnv, SUPABASE_URL: "https://other.supabase.co" }).errors).toContain(
      "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_URL: different origins",
    );
  });
  it("rejects a CI Clerk key for a real build", () => {
    expect(validateEnvironment({ ...buildEnv, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from("clerk-ci.example.invalid$").toString("base64")}` }).errors.length).toBeGreaterThan(0);
  });
  it("rejects mismatched Clerk test/live environments", () => {
    expect(validateEnvironment({ ...buildEnv, CLERK_SECRET_KEY: "sk_live_DO_NOT_PRINT" }).errors.length).toBeGreaterThan(0);
  });
  it("requires all SMS credentials only when enabled", () => {
    const disabled = validateEnvironment({ ...buildEnv, NEXT_PUBLIC_TWILIO_ENABLED: "false" }, true);
    const enabled = validateEnvironment({ ...buildEnv, NEXT_PUBLIC_TWILIO_ENABLED: "true" }, true);
    expect(disabled.errors.some((e: string) => e.startsWith("TWILIO"))).toBe(false);
    expect(enabled.errors.filter((e: string) => e.startsWith("TWILIO"))).toHaveLength(3);
  });
});

describe("read-only schema comparison", () => {
  const snapshot = () => ({
    format_version: 1,
    tables: [
      { schema: "public", name: "profiles", rls_enabled: true },
      { schema: "storage", name: "objects", rls_enabled: true },
    ],
    columns: [{ schema: "public", table_name: "profiles", name: "user_id", data_type: "text" }],
    policies: [] as Array<{ schema: string; table_name: string; name: string; qual: string }>,
    triggers: [], functions: [], constraints: [], storage_buckets: [{ id: "listingImages" }],
  });
  const contract = [{ name: "profiles", columns: ["user_id"] }];
  it("extracts Row columns without treating Insert/Update as tables", () => {
    expect(readCodeContract('export interface Database { public: { Tables: { profiles: { Row: { user_id: string; }; Insert: { user_id?: string; }; }; }; }; }')).toEqual(contract);
  });
  it("reports missing structure instead of producing a migration", () => {
    const result = compareSchema(snapshot(), [{ name: "producer_requests", columns: ["id"] }]);
    expect(result.errors).toContain("Missing table: public.producer_requests");
  });
  it("rejects snapshots without the expected catalog sections", () => {
    expect(() => compareSchema({ format_version: 1 }, contract)).toThrow("Invalid snapshot");
  });
  it("flags disabled RLS and UUID IDs", () => {
    const data = snapshot();
    data.tables[0].rls_enabled = false;
    data.columns[0].data_type = "uuid";
    expect(compareSchema(data, contract).errors).toHaveLength(2);
  });
  it("flags auth.uid policies despite a trailing text cast", () => {
    const data = snapshot();
    data.policies.push({ schema: "public", table_name: "profiles", name: "owner", qual: "user_id = auth.uid()::text" });
    expect(compareSchema(data, contract).errors).toContain("UUID auth.uid() in Clerk policy: public.profiles.owner");
  });
  it("checks RLS on public tables absent from application types", () => {
    const data = snapshot();
    data.tables.push({ schema: "public", name: "osm_import_review", rls_enabled: false });
    expect(compareSchema(data, contract).errors).toContain("RLS disabled: public.osm_import_review");
  });
  it("never equates matching structure with validated permissions", () => {
    const result = compareSchema(snapshot(), contract);
    expect(result.errors).toEqual([]);
    expect(result.review.some((s: string) => s.includes("real Clerk JWTs"))).toBe(true);
  });
});
