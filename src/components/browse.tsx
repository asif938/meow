import { Cat } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { getCategories, getWishedIds, searchListings, type ListingFilters } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { getT } from "@/lib/i18n";
import type { ListingType } from "@/db/types";
import { Filters, SortSelect } from "./filters";
import { ListingGrid } from "./listing-card";
import { Pagination } from "./pagination";

export async function Browse({
  title,
  description,
  basePath,
  filters,
  searchParams,
  fixedType,
  hideCategory,
  banner,
}: {
  title: string;
  description?: string;
  basePath: string;
  filters: ListingFilters;
  searchParams: Record<string, string | string[] | undefined>;
  fixedType?: ListingType;
  hideCategory?: boolean;
  banner?: React.ReactNode;
}) {
  const effective = { ...filters, type: fixedType ?? filters.type };
  const [result, categories, user, t] = await Promise.all([
    searchListings(effective),
    getCategories(),
    getCurrentUser(),
    getT(),
  ]);
  const wished = user ? await getWishedIds(user.id, result.items.map((i) => i.id)) : undefined;

  return (
    <div className="container-page py-6 sm:py-8">
      <div className="mb-5">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {banner}
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Filters
          basePath={basePath}
          filters={effective}
          categories={categories}
          fixedType={fixedType}
          hideCategory={hideCategory}
        />
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              {result.total.toLocaleString()} result{result.total === 1 ? "" : "s"}
              {filters.q && (
                <>
                  {" "}for <span className="font-semibold text-ink">&ldquo;{filters.q}&rdquo;</span>
                </>
              )}
            </p>
            <SortSelect value={filters.sort} />
          </div>
          {result.items.length ? (
            <ListingGrid items={result.items} wished={wished} />
          ) : (
            <EmptyState icon={<Cat className="h-10 w-10" />} title={t("common.noResults")} />
          )}
          <Pagination basePath={basePath} searchParams={searchParams} page={result.page} pages={result.pages} />
        </section>
      </div>
    </div>
  );
}
