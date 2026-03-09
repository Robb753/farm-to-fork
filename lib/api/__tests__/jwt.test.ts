import { describe, expect, it } from "vitest";
import { getJwtSub } from "@/lib/api/jwt";

// Helper : construit un token JWT avec un payload arbitraire
function makeToken(payload: Record<string, unknown>): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `header.${encoded}.signature`;
}

describe("getJwtSub", () => {
  it("extracts sub from a valid JWT payload", () => {
    const token = makeToken({ sub: "user_abc123", iss: "clerk" });
    expect(getJwtSub(token)).toBe("user_abc123");
  });

  it("returns null when sub is missing", () => {
    const token = makeToken({ iss: "clerk" });
    expect(getJwtSub(token)).toBeNull();
  });

  it("returns null when sub is a number (not a string)", () => {
    const token = makeToken({ sub: 12345 });
    expect(getJwtSub(token)).toBeNull();
  });

  it("returns null when sub is an empty string", () => {
    const token = makeToken({ sub: "" });
    expect(getJwtSub(token)).toBeNull();
  });

  it("returns null for a token with no payload segment", () => {
    expect(getJwtSub("onlyone")).toBeNull();
  });

  it("returns null for a completely empty string", () => {
    expect(getJwtSub("")).toBeNull();
  });

  it("returns null for a non-base64 payload", () => {
    expect(getJwtSub("header.!!!invalid!!!.sig")).toBeNull();
  });

  it("handles standard base64url encoding (- and _ chars)", () => {
    // base64url uses - instead of + and _ instead of /
    const raw = JSON.stringify({ sub: "user_xyz" });
    const b64url = Buffer.from(raw)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
    const token = `header.${b64url}.sig`;
    expect(getJwtSub(token)).toBe("user_xyz");
  });
});
