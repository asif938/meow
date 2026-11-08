"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function SearchBar({
  placeholder,
  compact,
  buttonLabel,
}: {
  placeholder: string;
  compact?: boolean;
  buttonLabel?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const query = q.trim();
        router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
      }}
      className={cn(
        "relative flex w-full items-center",
        !compact && "rounded-full bg-white p-1.5 shadow-lg shadow-orange-900/5 ring-1 ring-line",
      )}
    >
      <Search
        className={cn("pointer-events-none absolute h-4 w-4 text-muted", compact ? "left-3.5" : "left-5")}
        aria-hidden
      />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(
          "w-full bg-transparent text-sm focus:outline-none",
          compact
            ? "h-10 rounded-full border border-line bg-stone-50 pl-10 pr-4 focus:border-brand-300 focus:bg-white"
            : "h-11 pl-11 pr-3 text-base",
        )}
      />
      {!compact && (
        <button
          type="submit"
          className="h-11 shrink-0 cursor-pointer rounded-full bg-brand-500 px-6 font-medium text-white hover:bg-brand-600"
        >
          {buttonLabel ?? "Search"}
        </button>
      )}
    </form>
  );
}
