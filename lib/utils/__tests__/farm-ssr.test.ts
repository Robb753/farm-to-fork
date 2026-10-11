import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";

// Synthetic published listing: no remote database or Clerk session is used.
vi.mock("@/lib/data/listings", () => ({
  getListingBySlug: vi.fn(async () => ({
    id: 900001, slug: "synthetic-published-farm", name: "Synthetic published farm",
    active: true, clerk_user_id: "synthetic-owner", description: "<p>Safe description</p>",
    listingImages: [], certifications: [], lat: null, lng: null,
  })),
}));

import FarmPage from "@/app/farm/[slug]/page";

afterEach(() => vi.unstubAllGlobals());

it("renders the public farm route with a synthetic published listing", async () => {
  // The repository Vitest config uses the classic JSX transform.
  vi.stubGlobal("React", React);
  const page = await FarmPage({ params: Promise.resolve({ slug: "synthetic-published-farm" }) });
  const html = renderToStaticMarkup(page);
  expect(html).toContain("Synthetic published farm");
  expect(html).toContain("Fil d&#x27;Ariane");
});
