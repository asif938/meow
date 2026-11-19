import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { SidebarShell, type SidebarItem } from "@/components/dashboard/sidebar-shell";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const ITEMS: SidebarItem[] = [
  { href: "/admin", label: "Overview", icon: "overview", exact: true },
  { href: "/admin/users", label: "Manage Users", icon: "users" },
  { href: "/admin/listings", label: "Manage Items", icon: "items" },
  { href: "/admin/sellers", label: "Seller verification", icon: "sellers" },
  { href: "/admin/reports", label: "Reports", icon: "reports" },
  { href: "/admin/categories", label: "Categories", icon: "categories" },
  { href: "/admin/blog", label: "Blog posts", icon: "blog" },
  { href: "/admin/messages", label: "Messages", icon: "messages" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <SidebarShell title="Admin" subtitle={admin.email} items={ITEMS}>
      {children}
    </SidebarShell>
  );
}
