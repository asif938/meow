import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="container-page py-6 sm:py-8">
      <h1 className="mb-4 font-display text-2xl font-bold">Admin</h1>
      <AdminNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
