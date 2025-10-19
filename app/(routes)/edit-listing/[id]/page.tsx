// app/routes/edit-listing/[id]/page.tsx
"use client";

import EditListing from "../_components/EditListing";

export default function EditListingPage({
  params,
}: {
  params: { id: string };
}) {
  return <EditListing params={params} />;
}
