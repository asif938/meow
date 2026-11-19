import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TH } from "@/components/ui";
import type { SearchParams, TableQuery } from "@/lib/table";

/** Sortable column header: a plain link that flips asc/desc in the URL. */
export function SortTH({
  label,
  field,
  basePath,
  searchParams,
  query,
  className,
}: {
  label: string;
  field: string;
  basePath: string;
  searchParams: SearchParams;
  query: TableQuery;
  className?: string;
}) {
  const active = query.sort === field;
  const nextDir = active && query.dir === "asc" ? "desc" : "asc";
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (k === "page" || k === "sort" || k === "dir" || v === undefined) continue;
    sp.set(k, Array.isArray(v) ? v[0] : v);
  }
  sp.set("sort", field);
  sp.set("dir", nextDir);
  const Icon = !active ? ArrowUpDown : query.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TH className={className} aria-sort={active ? (query.dir === "asc" ? "ascending" : "descending") : "none"}>
      <Link href={`${basePath}?${sp.toString()}`} className="inline-flex items-center gap-1 uppercase hover:text-ink">
        {label} <Icon className={active ? "h-3.5 w-3.5 text-brand-600" : "h-3.5 w-3.5 opacity-50"} aria-hidden />
      </Link>
    </TH>
  );
}
