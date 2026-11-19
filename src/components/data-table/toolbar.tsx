"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input, Select } from "@/components/ui";

export type FilterDef = { name: string; label: string; options: { value: string; label: string }[] };

/** Search box (debounced) + filter dropdowns. Everything lives in the URL, so the server does the filtering. */
export function TableToolbar({ placeholder, filters = [] }: { placeholder: string; filters?: FilterDef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(changes)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.delete("page");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  useEffect(() => () => clearTimeout(timer.current), []);

  const active = Boolean(params.get("q") || filters.some((f) => params.get(f.name)));

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" role="search">
      <div className="relative w-full sm:max-w-xs">
        <label htmlFor="table-q" className="sr-only">Search</label>
        <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted" aria-hidden />
        <Input
          id="table-q"
          value={q}
          placeholder={placeholder}
          className="pl-10"
          onChange={(e) => {
            const v = e.target.value;
            setQ(v);
            clearTimeout(timer.current);
            timer.current = setTimeout(() => update({ q: v.trim() }), 350);
          }}
        />
      </div>
      {filters.map((f) => (
        <div key={f.name} className="sm:w-44">
          <label htmlFor={`filter-${f.name}`} className="sr-only">{f.label}</label>
          <Select id={`filter-${f.name}`} value={params.get(f.name) ?? ""} onChange={(e) => update({ [f.name]: e.target.value })}>
            <option value="">{f.label}: all</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </Select>
        </div>
      ))}
      {active && (
        <button
          type="button"
          onClick={() => {
            setQ("");
            router.replace(pathname, { scroll: false });
          }}
          className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-muted hover:text-ink"
        >
          <X className="h-4 w-4" /> Clear
        </button>
      )}
    </div>
  );
}
