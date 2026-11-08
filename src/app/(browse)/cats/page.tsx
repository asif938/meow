import type { Metadata } from "next";
import { Browse } from "@/components/browse";
import { parseFilters } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Cats for sale",
  description: "Persian, Bengal, British Shorthair and local cats for sale across Bangladesh, with vaccine and health info.",
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function CatsPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Browse
      title="Cats for sale"
      description="Every listing includes age, vaccine and health information. Minimum age 8 weeks."
      basePath="/cats"
      fixedType="cat"
      filters={parseFilters(sp)}
      searchParams={sp}
    />
  );
}
