"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  FileText,
  Flag,
  Heart,
  LayoutDashboard,
  ListChecks,
  Mail,
  Menu,
  Package,
  PanelLeft,
  Settings,
  ShieldCheck,
  Tags,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  items: Package,
  orders: ListChecks,
  wishlist: Heart,
  shop: ShieldCheck,
  profile: User,
  settings: Settings,
  users: Users,
  reports: Flag,
  categories: Tags,
  blog: BookOpen,
  messages: Mail,
  sellers: ShieldCheck,
  analytics: BarChart3,
  pages: FileText,
};

export type SidebarItem = { href: string; label: string; icon: keyof typeof ICONS; exact?: boolean };

/**
 * Dashboard layout with a persistent sidebar on desktop and a slide-in drawer on mobile.
 * Shared by the user and admin dashboards; only the item list differs.
 */
export function SidebarShell({
  title,
  subtitle,
  items,
  children,
}: {
  title: string;
  subtitle?: string;
  items: SidebarItem[];
  children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = (
    <nav aria-label={`${title} menu`} className="space-y-1">
      {items.map((item) => {
        const Icon = ICONS[item.icon] ?? PanelLeft;
        const active = item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-brand-100 text-brand-700" : "text-muted hover:bg-brand-50 hover:text-ink",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const current = items.find((i) => (i.exact ? path === i.href : path === i.href || path.startsWith(`${i.href}/`)));

  return (
    <div className="container-wide py-4 sm:py-6 lg:flex lg:gap-8">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="sticky top-24 rounded-xl border border-line bg-surface p-3">
          <div className="mb-3 border-b border-line px-3 pb-3">
            <p className="font-display text-lg font-bold">{title}</p>
            {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
          </div>
          {nav}
        </div>
      </aside>

      {/* Mobile bar */}
      <div className="mb-4 flex items-center justify-between rounded-xl border border-line bg-surface px-3 py-2 lg:hidden">
        <p className="truncate font-medium">
          <span className="text-muted">{title} · </span>
          {current?.label ?? "Menu"}
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open ${title} menu`}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium"
        >
          <Menu className="h-4 w-4" /> Menu
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={`${title} menu`}>
          <button type="button" aria-label="Close menu" className="absolute inset-0 cursor-pointer bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] overflow-y-auto bg-surface p-4 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="font-display text-lg font-bold">{title}</p>
                {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg hover:bg-brand-50">
                <X className="h-4 w-4" />
              </button>
            </div>
            {nav}
          </div>
        </div>
      )}

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
