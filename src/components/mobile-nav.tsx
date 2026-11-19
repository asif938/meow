"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "./logout-button";
import { ThemeToggle } from "./theme-toggle";
import type { MegaGroup } from "./explore-menu";

export type NavLink = { href: string; label: string };

/** Hamburger menu for < lg screens: all routes, search, theme and sign-out in one drawer. */
export function MobileNav({
  links,
  groups,
  exploreLabel,
  loggedIn,
  logoutLabel,
  loginLabel,
  registerLabel,
  sellLabel,
  children,
}: {
  links: NavLink[];
  groups: MegaGroup[];
  exploreLabel: string;
  loggedIn: boolean;
  logoutLabel: string;
  loginLabel: string;
  registerLabel: string;
  sellLabel: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname();

  // Close the drawer after navigating.
  useEffect(() => setOpen(false), [path]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const item = "block rounded-xl px-3 py-3 text-base font-medium hover:bg-brand-50";

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl hover:bg-brand-50"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      {open && (
        <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-line bg-surface">
          <div className="container-wide space-y-4 py-4">
            {children}
            <nav aria-label="Mobile" className="space-y-1">
              <Link href="/" className={item}>{links[0]?.label}</Link>
              <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">{exploreLabel}</p>
              {groups.map((g) => (
                <Link key={g.href} href={g.href} className={`${item} flex items-center justify-between gap-3`}>
                  {g.title}
                  <span className="text-xs font-normal text-muted">{g.description}</span>
                </Link>
              ))}
              <div className="my-2 border-t border-line" />
              {links.slice(1).map((l) => (
                <Link key={l.href} href={l.href} className={item}>{l.label}</Link>
              ))}
            </nav>
            <div className="flex items-center gap-2 border-t border-line pt-4">
              <Link href="/sell/new" className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-brand-600 font-medium text-white">
                {sellLabel}
              </Link>
              <ThemeToggle className="border border-line" />
            </div>
            {loggedIn ? (
              <LogoutButton label={logoutLabel} className="w-full justify-center rounded-xl border border-line px-4 py-3 text-base font-medium" />
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/login" className="inline-flex h-11 items-center justify-center rounded-xl border border-line font-medium">{loginLabel}</Link>
                <Link href="/register" className="inline-flex h-11 items-center justify-center rounded-xl border border-line font-medium">{registerLabel}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
