"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";

export type MegaGroup = { title: string; href: string; description: string; links: { label: string; href: string }[] };

/** Desktop "Explore" mega menu: three marketplace areas with their top categories. */
export function ExploreMenu({ label, groups, allLabel }: { label: string; groups: MegaGroup[]; allLabel: string }) {
  return (
    <Dropdown
      label={label}
      align="left"
      caret
      triggerClassName="rounded-xl px-3 py-2 text-sm font-medium hover:bg-brand-50"
      trigger={<span>{label}</span>}
      panelClassName="w-[44rem] max-w-[calc(100vw-2rem)] p-4"
    >
      <div className="grid gap-5 sm:grid-cols-3">
        {groups.map((g) => (
          <div key={g.href}>
            <Link href={g.href} role="menuitem" className="group block">
              <p className="flex items-center gap-1 font-display font-bold">
                {g.title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </p>
              <p className="mt-0.5 text-xs text-muted">{g.description}</p>
            </Link>
            <ul className="mt-3 space-y-1">
              {g.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} role="menuitem" className="block rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-brand-50 hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-line pt-3">
        <Link href="/search" role="menuitem" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600">
          {allLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </Dropdown>
  );
}
