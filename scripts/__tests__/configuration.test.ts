import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
const { assertProductionSupabaseEnvironment } = require("../environment.cjs");
const production = {
  VERCEL_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://reukdkgdlvgdvyuwuaub.supabase.co",
  SUPABASE_URL: "https://reukdkgdlvgdvyuwuaub.supabase.co",
};

describe("Production Supabase boundary", () => {
  it("accepts both exact Production URLs", () => {
    expect(() => assertProductionSupabaseEnvironment(production)).not.toThrow();
  });
  it.each([
    "https://eistpzpsdsbpvorgqxke.supabase.co",
    "http://localhost:54321", "http://127.0.0.1:54321", "http://[::1]:54321",
    "https://other.supabase.co", undefined, "",
    `${production.SUPABASE_URL}/`, `${production.SUPABASE_URL}?x=1`,
    `${production.SUPABASE_URL}#fragment`, `${production.SUPABASE_URL}.evil.test`,
    "https://DO_NOT_PRINT@reukdkgdlvgdvyuwuaub.supabase.co",
  ])("rejects invalid or missing values in either slot: %s", (url) => {
    for (const name of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"]) {
      const check = () => assertProductionSupabaseEnvironment({ ...production, [name]: url });
      expect(check).toThrow(name);
      try { check(); } catch (error) {
        expect(String(error)).not.toContain("DO_NOT_PRINT");
      }
    }
  });
  it.each(["preview", "development", "test", undefined])("preserves other environments: %s", (environment) => {
    for (const url of [undefined, "http://127.0.0.1:54321", production.SUPABASE_URL]) {
      expect(() => assertProductionSupabaseEnvironment({
        VERCEL_ENV: environment, NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_URL: url,
      })).not.toThrow();
    }
  });
  it("Next config rejects invalid Production before build and preserves Preview", () => {
    const code = 'require("./next.config.js")("phase-production-build")';
    const result = spawnSync(process.execPath, ["-e", code], {
      encoding: "utf8", env: { ...process.env, ...production, SUPABASE_URL: "DO_NOT_PRINT" },
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Production Supabase guard");
    expect(result.stderr).not.toContain("DO_NOT_PRINT");
    const preview = spawnSync(process.execPath, ["-e", code], {
      encoding: "utf8", env: { ...process.env, VERCEL_ENV: "preview", SUPABASE_URL: "" },
    });
    expect(preview.status).toBe(0);
  });
});
