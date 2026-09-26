import { describe, expect, it, vi, afterEach } from "vitest";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { replaceLocalValues } from "../configure-local-env.mjs";

const require = createRequire(import.meta.url);
// CommonJS module is also loaded by Next's configuration before server startup.
const childProcess = require("node:child_process");
const local = require("../local-environment.cjs");
const status = { API_URL: "http://127.0.0.1:54321", ANON_KEY: "local-anon", SERVICE_ROLE_KEY: "local-service" };
const env = {
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: status.SERVICE_ROLE_KEY,
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from("humane-buffalo-60.clerk.accounts.dev$").toString("base64")}`,
  CLERK_SECRET_KEY: "sk_test_DO_NOT_PRINT",
};
afterEach(() => vi.restoreAllMocks());

describe("local development boundary", () => {
  it("accepts the local stack and existing Clerk Development", () => {
    expect(local.validateLocalEnvironment(env, status)).toEqual([]);
  });
  it("accepts localhost as a loopback alias for Supabase", () => {
    expect(local.validateLocalEnvironment({ ...env, SUPABASE_URL: "http://localhost:54321" }, status)).toEqual([]);
  });
  it.each([
    "https://reukdkgdlvgdvyuwuaub.supabase.co",
    "https://other.supabase.co", "http://127.0.0.1.evil.test:54321",
    "http://127.0.0.1:54322", "http://secret@localhost:54321",
    "http://localhost:54321/rest/v1", "http://localhost:54321?target=remote",
  ])("refuses remote or ambiguous targets in either URL: %s", (url) => {
    for (const name of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
      expect(local.validateLocalEnvironment({ ...env, [name]: url }, status).length).toBeGreaterThan(0);
    }
  });
  it("refuses production Clerk, foreign Development instances and remote app URLs", () => {
    for (const change of [
      { CLERK_SECRET_KEY: "sk_live_DO_NOT_PRINT" },
      { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_DO_NOT_PRINT" },
      { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: `pk_test_${Buffer.from("other.clerk.accounts.dev$").toString("base64")}` },
      { NEXT_PUBLIC_APP_URL: "https://farm2fork.fr" },
      { NEXT_PUBLIC_SITE_URL: "https://farm2fork.fr" },
      { NEXT_PUBLIC_VERCEL_URL: "example.vercel.app" },
      { NEXT_PUBLIC_ALLOW_VERCEL_PREVIEWS: "true" },
    ]) {
      const errors = local.validateLocalEnvironment({ ...env, ...change }, status);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.join()).not.toContain("DO_NOT_PRINT");
    }
  });
  it("refuses remote keys even when both URLs are local, including the server alias", () => {
    for (const name of ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"]) {
      expect(local.validateLocalEnvironment({ ...env, [name]: "PROD_SECRET_DO_NOT_PRINT" }, status).join()).toContain(name);
      expect(local.validateLocalEnvironment({ ...env, [name]: "PROD_SECRET_DO_NOT_PRINT" }, status).join()).not.toContain("PROD_SECRET_DO_NOT_PRINT");
    }
  });
  it("refuses unavailable/incomplete or nonlocal status", () => {
    expect(local.validateLocalEnvironment(env, {})).not.toEqual([]);
    expect(local.validateLocalEnvironment(env, { ...status, API_URL: "https://remote.supabase.co" })).not.toEqual([]);
  });
  it("npm run dev rejects production before Next or Supabase CLI starts", () => {
    const result = spawnSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev"], {
      encoding: "utf8", timeout: 15000, shell: process.platform === "win32",
      env: { ...process.env, ...env, SUPABASE_URL: "https://reukdkgdlvgdvyuwuaub.supabase.co" },
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("Local development refused");
    expect(result.stderr).not.toContain("DO_NOT_PRINT");
    expect(result.stdout).not.toContain("Ready");
  });
  it("unsafe config makes zero subprocess/network attempts", () => {
    // Reload to capture the spy instead of the original destructured import.
    const spy = vi.spyOn(childProcess, "spawnSync");
    delete require.cache[require.resolve("../local-environment.cjs")];
    const guard = require("../local-environment.cjs");
    expect(() => guard.assertLocalEnvironment({ ...env, SUPABASE_URL: "https://reukdkgdlvgdvyuwuaub.supabase.co" })).toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
  it("reads only local CLI status and compares keys before permitting startup", () => {
    const spy = vi.spyOn(childProcess, "spawnSync").mockReturnValue({ status: 0, stdout: JSON.stringify(status) });
    delete require.cache[require.resolve("../local-environment.cjs")];
    const guard = require("../local-environment.cjs");
    expect(() => guard.assertLocalEnvironment(env)).not.toThrow();
    expect(spy.mock.calls[0][1]).toEqual(["--yes", "supabase@2.117.0", "status", "-o", "json"]);
    expect(() => guard.assertLocalEnvironment({ ...env, SUPABASE_SERVICE_ROLE_KEY: "wrong" })).toThrow("does not match");
  });
  it("does not leak CLI output containing secrets on failure", () => {
    vi.spyOn(childProcess, "spawnSync").mockReturnValue({ status: 1, stdout: "SECRET", stderr: "SECRET" });
    delete require.cache[require.resolve("../local-environment.cjs")];
    const guard = require("../local-environment.cjs");
    expect(() => guard.assertLocalEnvironment(env)).toThrow("Local Supabase status unavailable");
  });
});

describe("environment-specific browser network policy", () => {
  it("allows only loopback Supabase in Development", () => {
    const config = local.supabaseNetworkConfig(status.API_URL, true);
    expect(JSON.stringify(config)).not.toContain("supabase.co");
    expect(config.connectSources).toContain("ws://127.0.0.1:54321");
    expect(config.imagePattern.hostname).toBe("127.0.0.1");
    expect(() => local.supabaseNetworkConfig("https://reukdkgdlvgdvyuwuaub.supabase.co", true)).toThrow();
  });
  it("preserves current Production image and connection destinations", () => {
    const config = local.supabaseNetworkConfig("https://reukdkgdlvgdvyuwuaub.supabase.co", false);
    expect(config.imagePattern.hostname).toBe("reukdkgdlvgdvyuwuaub.supabase.co");
    expect(config.connectSources).toEqual(["https://*.supabase.co", "wss://*.supabase.co"]);
  });
});

describe("local env file preparation", () => {
  it("replaces only selected keys, handles CRLF/export/duplicates and preserves Clerk", () => {
    const input = '# comment\r\nCLERK_SECRET_KEY=sk_test_keep\r\nexport SUPABASE_URL=remote\r\nSUPABASE_URL=duplicate\r\nRESEND_API_KEY=keep\r\n';
    const output = replaceLocalValues(input, { SUPABASE_URL: status.API_URL, NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL });
    expect(output).toContain("CLERK_SECRET_KEY=sk_test_keep");
    expect(output).toContain("RESEND_API_KEY=keep");
    expect(output.match(/SUPABASE_URL=/g)).toHaveLength(1);
    expect(output).not.toContain("remote");
    expect(output).toContain("NEXT_PUBLIC_APP_URL=http://localhost:3000");
  });
});
