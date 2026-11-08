"use client";

import { useMemo } from "react";
import type { ListingRowData } from "@/lib/dashboard-types";

const COLORS: Record<string, string> = {
  active: "#16a34a",
  pending: "#d97706",
  draft: "#78716c",
  sold: "#2563eb",
  adopted: "#0d9488",
  rejected: "#dc2626",
};

/** Dependency-free SVG analytics. Loaded on demand via React.lazy from ListingsManager. */
export default function AnalyticsPanel({ rows }: { rows: ListingRowData[] }) {
  const { top, byStatus, max, total } = useMemo(() => {
    const top = [...rows].sort((a, b) => b.viewCount - a.viewCount).slice(0, 8);
    const byStatus = new Map<string, number>();
    for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + r.viewCount);
    return {
      top,
      byStatus: [...byStatus.entries()].sort((a, b) => b[1] - a[1]),
      max: Math.max(1, top[0]?.viewCount ?? 1),
      total: rows.reduce((n, r) => n + r.viewCount, 0),
    };
  }, [rows]);

  return (
    <div className="grid gap-6 rounded-2xl border border-line bg-white p-4 md:grid-cols-2" style={{ minHeight: 280 }}>
      <section aria-labelledby="top-views">
        <h3 id="top-views" className="mb-3 text-sm font-semibold">Top listings by views</h3>
        <svg viewBox="0 0 400 200" role="img" aria-label="Bar chart of the eight most viewed listings" className="w-full">
          {top.map((r, i) => {
            const w = (r.viewCount / max) * 200;
            return (
              <g key={r.id} transform={`translate(0 ${i * 25})`}>
                <text x="0" y="14" fontSize="10" fill="currentColor">
                  {r.title.length > 24 ? `${r.title.slice(0, 23)}…` : r.title}
                </text>
                <rect x="140" y="3" width={Math.max(2, w)} height="16" rx="4" fill="#f97316" />
                <text x={146 + w} y="15" fontSize="10" fill="currentColor">{r.viewCount}</text>
              </g>
            );
          })}
        </svg>
      </section>
      <section aria-labelledby="views-status">
        <h3 id="views-status" className="mb-3 text-sm font-semibold">Views by status</h3>
        <ul className="space-y-2 text-sm">
          {byStatus.map(([status, n]) => (
            <li key={status}>
              <div className="flex justify-between text-xs capitalize">
                <span>{status}</span>
                <span>{n} ({total ? Math.round((n / total) * 100) : 0}%)</span>
              </div>
              <div className="h-2 rounded-full bg-stone-100">
                <div className="h-2 rounded-full" style={{ width: `${total ? (n / total) * 100 : 0}%`, background: COLORS[status] }} />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
