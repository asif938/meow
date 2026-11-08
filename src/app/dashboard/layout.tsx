import Link from "next/link";
import { requireUser } from "@/lib/session";
import { DashboardNav } from "./dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser("/dashboard");
  const sp = user.sellerProfile;
  return (
    <div className="container-page py-6 sm:py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">Seller dashboard</p>
          <h1 className="font-display text-2xl font-bold">{sp?.shopName ?? user.name}</h1>
        </div>
        <Link href={`/seller/${user.username}`} className="text-sm font-semibold text-brand-600 hover:underline">
          View public profile →
        </Link>
      </div>
      <DashboardNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
