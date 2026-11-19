export type SearchParams = Record<string, string | string[] | undefined>;

export type TableQuery = {
  q: string;
  page: number;
  sort: string;
  dir: "asc" | "desc";
  filters: Record<string, string>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/**
 * Reads table state (search, filters, sort, page) from the URL, whitelisting every value so it is
 * safe to use in Prisma `where`/`orderBy` clauses.
 */
export function parseTableQuery(
  sp: SearchParams,
  opts: { sorts: readonly string[]; defaultSort: string; defaultDir?: "asc" | "desc"; filters?: Record<string, readonly string[]> },
): TableQuery {
  const sort = opts.sorts.includes(first(sp.sort)) ? first(sp.sort) : opts.defaultSort;
  const dirParam = first(sp.dir);
  const dir = dirParam === "asc" || dirParam === "desc" ? dirParam : (opts.defaultDir ?? "desc");
  const filters: Record<string, string> = {};
  for (const [name, allowed] of Object.entries(opts.filters ?? {})) {
    const v = first(sp[name]);
    if (allowed.includes(v)) filters[name] = v;
  }
  return {
    q: first(sp.q).trim().slice(0, 100),
    page: Math.max(1, Math.min(10_000, Number.parseInt(first(sp.page), 10) || 1)),
    sort,
    dir,
    filters,
  };
}

export const PAGE_SIZE_TABLE = 10;
