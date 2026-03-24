// app/page.tsx
import HomePageClient from "./_components/layout/HomePageClient";
import { getLieux } from "@/lib/data/listings";
import type { Listing } from "@/lib/types";

export default async function Home(): Promise<JSX.Element> {
  const listings: Listing[] = await getLieux();
  return <HomePageClient listings={listings} />;
}
