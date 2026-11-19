import { requireUser } from "@/lib/session";
import { SidebarShell, type SidebarItem } from "@/components/dashboard/sidebar-shell";

const ITEMS: SidebarItem[] = [
  { href: "/dashboard", label: "Overview", icon: "overview", exact: true },
  { href: "/dashboard/listings", label: "My Items", icon: "items" },
  { href: "/dashboard/orders", label: "Orders & requests", icon: "orders" },
  { href: "/account", label: "Wishlist & purchases", icon: "wishlist" },
  { href: "/dashboard/shop", label: "Shop & verification", icon: "shop" },
  { href: "/dashboard/profile", label: "Profile", icon: "profile" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  return (
    <SidebarShell title="My dashboard" subtitle={user.sellerProfile?.shopName ?? user.name} items={ITEMS}>
      {children}
    </SidebarShell>
  );
}
