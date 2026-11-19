import { ChevronDown } from "lucide-react";
import type { Faq } from "@/lib/faq";

/** Accessible accordion using native <details>: works without JavaScript. */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line rounded-xl border border-line bg-surface">
      {items.map((f) => (
        <details key={f.q} className="group px-4 py-1 sm:px-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 font-medium [&::-webkit-details-marker]:hidden">
            {f.q}
            <ChevronDown className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-180" aria-hidden />
          </summary>
          <p className="pb-4 text-sm leading-relaxed text-muted">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
