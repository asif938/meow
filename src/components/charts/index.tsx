"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui";
import type { MultiPoint, Point } from "./impl";

// Recharts is ~100 KB: load it only when a dashboard chart is actually rendered.
const loading = () => <Skeleton className="h-full w-full" />;
const BarImpl = dynamic(() => import("./impl").then((m) => m.BarImpl), { ssr: false, loading });
const LineImpl = dynamic(() => import("./impl").then((m) => m.LineImpl), { ssr: false, loading });
const PieImpl = dynamic(() => import("./impl").then((m) => m.PieImpl), { ssr: false, loading });

function ChartCard({ title, description, empty, children }: { title: string; description?: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="text-h3">{title}</h3>
      {description && <p className="text-xs text-muted">{description}</p>}
      <div className="mt-4 h-64 w-full" role="img" aria-label={title}>
        {empty ? <div className="grid h-full place-items-center text-sm text-muted">No data yet</div> : children}
      </div>
    </section>
  );
}

export function BarChartCard({ title, description, data, unit }: { title: string; description?: string; data: Point[]; unit?: string }) {
  return (
    <ChartCard title={title} description={description} empty={data.every((d) => d.value === 0)}>
      <BarImpl data={data} unit={unit} />
    </ChartCard>
  );
}

export function LineChartCard({
  title,
  description,
  data,
  series,
}: {
  title: string;
  description?: string;
  data: MultiPoint[];
  series: { key: string; name: string }[];
}) {
  return (
    <ChartCard title={title} description={description} empty={data.every((d) => series.every((s) => !d[s.key]))}>
      <LineImpl data={data} series={series} />
    </ChartCard>
  );
}

export function PieChartCard({ title, description, data }: { title: string; description?: string; data: Point[] }) {
  const filtered = data.filter((d) => d.value > 0);
  return (
    <ChartCard title={title} description={description} empty={filtered.length === 0}>
      <PieImpl data={filtered} />
    </ChartCard>
  );
}
