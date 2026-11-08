import type { Metadata } from "next";
import { Browse } from "@/components/browse";
import { parseFilters } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Cat supplies",
  description: "Cat food, litter, toys, grooming, furniture and travel gear — new from verified shops or used from cat owners.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ShopPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Browse
      title="Shop cat supplies"
      description="New products from verified shops, pre-loved items from fellow cat parents."
      basePath="/shop"
      fixedType="supply"
      filters={parseFilters(sp)}
      searchParams={sp}
    />
  );
}
