import { cn } from "@/lib/utils";

/** KPI tile used on both dashboards. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "brand" | "teal" | "neutral";
}) {
  const tones = {
    brand: "bg-brand-50 text-brand-600",
    teal: "bg-teal-50 text-teal-700",
    neutral: "bg-stone-100 text-stone-700",
  };
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-surface p-4">
      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl", tones[tone])}>
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm text-muted">{label}</p>
        <p className="font-display text-2xl font-bold leading-tight">{typeof value === "number" ? value.toLocaleString("en-US") : value}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}
