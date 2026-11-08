"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "My listings" },
  { href: "/dashboard/orders", label: "Orders & requests" },
  { href: "/dashboard/shop", label: "Shop & verification" },
];

export function DashboardNav() {
  const path = usePathname();
  return (
    <nav className="scrollbar-none flex gap-1 overflow-x-auto border-b border-line">
      {LINKS.map((l) => {
        const active = l.href === "/dashboard" ? path === "/dashboard" : path.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium",
              active ? "border-brand-500 text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
