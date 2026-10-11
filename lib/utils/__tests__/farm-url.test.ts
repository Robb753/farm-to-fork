import { describe, expect, it } from "vitest";
import { getPublicFarmUrl } from "../farm-url";

describe("public farm links", () => {
  it("prefers the slug over the numeric ID", () => {
    expect(getPublicFarmUrl({ id: 8, slug: "ferme-test-preview" }))
      .toBe("/farm/ferme-test-preview");
  });

  it.each([null, undefined, ""])("uses the ID redirect when slug is %s", (slug) => {
    expect(getPublicFarmUrl({ id: 8, slug })).toBe("/farm/id/8");
  });

  it("encodes the slug as one path segment", () => {
    expect(getPublicFarmUrl({ id: 8, slug: "ferme?x#y" }))
      .toBe("/farm/ferme%3Fx%23y");
  });
});
