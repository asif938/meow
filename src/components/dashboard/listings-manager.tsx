"use client";

import { lazy, Suspense, useCallback, useMemo, useRef, useState } from "react";
import { ArrowUp, BarChart3, Download } from "lucide-react";
import { createSelectionStore, useScrolledPast, useSelectionCount } from "@/lib/hooks";
import type { ListingRowData, ListingStatus } from "@/lib/dashboard-types";
import { Select, buttonClass } from "@/components/ui";
import { SearchBox } from "./search-box";
import { ListingRow } from "./listing-row";
import { VirtualList } from "./virtual-list";

// Code-split: the analytics bundle is only downloaded when the user opens the panel.
const AnalyticsPanel = lazy(() => import("./analytics-panel"));

type Sort = "newest" | "views" | "title";
const STATUS_OPTIONS: (ListingStatus | "all")[] = ["all", "active", "pending", "draft", "sold", "adopted", "rejected"];

function csvCell(v: string | number | null) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ListingsManager({ rows }: { rows: ListingRowData[] }) {
  const [query, setQuery] = useState(""); // committed (debounced) query only
  const [status, setStatus] = useState<ListingStatus | "all">("all");
  const [sort, setSort] = useState<Sort>("newest");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [store] = useState(createSelectionStore);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolled, onScroll] = useScrolledPast(600);

  // Lowercased haystack built once per dataset, not once per keystroke.
  const indexed = useMemo(() => rows.map((r) => ({ r, hay: `${r.title} ${r.type} ${r.slug}`.toLowerCase() })), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out = indexed.filter((x) => (status === "all" || x.r.status === status) && (!q || x.hay.includes(q))).map((x) => x.r);
    if (sort === "views") out.sort((a, b) => b.viewCount - a.viewCount);
    else if (sort === "title") out.sort((a, b) => a.title.localeCompare(b.title));
    return out; // "newest" = server order (createdAt desc)
  }, [indexed, query, status, sort]);

  const selectedCount = useSelectionCount(store);

  // Stable identities so the memoized rows / list never see new function props.
  const handleSearch = useCallback((q: string) => setQuery(q), []);
  const getKey = useCallback((r: ListingRowData) => r.id, []);
  const renderRow = useCallback((r: ListingRowData) => <ListingRow row={r} store={store} />, [store]);

  const exportCsv = useCallback(() => {
    const picked = rows.filter((r) => store.has(r.id));
    const csv = [
      ["id", "title", "type", "status", "price", "views"],
      ...picked.map((r) => [r.id, r.title, r.type, r.status, r.priceLabel, r.viewCount]),
    ]
      .map((line) => line.map(csvCell).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "listings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [rows, store]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBox onSearch={handleSearch} placeholder="Search your listings…" label="Search your listings" className="flex-1" />
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value as ListingStatus | "all")} className="sm:w-40">
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
        <Select aria-label="Sort listings" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="sm:w-40">
          <option value="newest">Newest</option>
          <option value="views">Most viewed</option>
          <option value="title">Title A–Z</option>
        </Select>
        <button type="button" aria-expanded={showAnalytics} onClick={() => setShowAnalytics((v) => !v)} className={buttonClass("outline", "md")}>
          <BarChart3 className="h-4 w-4" /> Analytics
        </button>
      </div>

      {showAnalytics && (
        <Suspense
          fallback={<div className="animate-pulse rounded-2xl border border-line bg-stone-50" style={{ minHeight: 280 }} aria-busy="true" aria-label="Loading analytics" />}
        >
          <AnalyticsPanel rows={rows} />
        </Suspense>
      )}

      <div className="flex min-h-9 items-center justify-between text-sm text-muted" aria-live="polite">
        <span>
          Showing {visible.length.toLocaleString()} of {rows.length.toLocaleString()} listings
        </span>
        {selectedCount > 0 && (
          <span className="flex items-center gap-3">
            {selectedCount} selected
            <button type="button" onClick={exportCsv} className={buttonClass("outline", "sm")}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
            <button type="button" onClick={() => store.clear()} className="underline">
              Clear
            </button>
          </span>
        )}
      </div>

      <div className="relative">
        {visible.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-10 text-center text-sm text-muted">No listings match your filters.</p>
        ) : (
          <VirtualList
            items={visible}
            getKey={getKey}
            estimateSize={96}
            renderRow={renderRow}
            scrollRef={scrollRef}
            onScroll={onScroll}
            label="Your listings"
            className="h-[70vh] min-h-[420px] overflow-y-auto overscroll-contain pr-1"
          />
        )}
        {scrolled && (
          <button
            type="button"
            aria-label="Back to top"
            onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
