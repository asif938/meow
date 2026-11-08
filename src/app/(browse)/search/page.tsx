import type { Metadata } from "next";
import { Browse } from "@/components/browse";
import { parseFilters } from "@/lib/queries";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  return (
    <Browse
      title={filters.q ? `Results for “${filters.q}”` : "Browse everything"}
      basePath="/search"
      filters={filters}
      searchParams={sp}
    />
  );
}
