import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Heart, Package, Plus, Wallet, ClipboardList, Hourglass } from "lucide-react";
import { requireUser } from "@/lib/session";
import { sellerOverview } from "@/lib/dashboard-stats";
import { formatBDT } from "@/lib/utils";
import { Alert, PageHeader, buttonClass } from "@/components/ui";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChartCard, LineChartCard, PieChartCard } from "@/components/charts";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

export default async function DashboardOverviewPage() {
  const user = await requireUser("/dashboard");
  const s = await sellerOverview(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Here is how your listings are performing."
        actions={
          <Link href="/sell/new" className={buttonClass("primary", "md")}>
            <Plus className="h-4 w-4" /> New listing
          </Link>
        }
      />
      {!user.isPhoneVerified && (
        <Alert tone="amber">
          Verify your phone number to start posting. <Link href="/verify?next=/dashboard" className="font-semibold underline">Verify now</Link>
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total listings" value={s.total} hint={`${s.active} active`} icon={Package} />
        <StatCard label="Total views" value={s.views} icon={Eye} tone="teal" />
        <StatCard label="Orders received" value={s.orderCount} icon={ClipboardList} tone="neutral" />
        <StatCard label="Revenue (delivered)" value={formatBDT(s.revenue)} icon={Wallet} />
        <StatCard label="Pending adoption requests" value={s.pendingRequests} icon={Hourglass} tone="teal" />
        <StatCard label="Times saved to wishlists" value={s.saves} icon={Heart} tone="neutral" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard
          title="Listings posted"
          description="Last 6 months"
          data={s.listingsMonthly.map((p) => ({ label: p.label, listings: p.value }))}
          series={[{ key: "listings", name: "Listings" }]}
        />
        <BarChartCard title="Most viewed listings" description="Top 6 by views" data={s.topViewed} unit="views" />
        <PieChartCard title="Listings by status" data={s.byStatus} />
        <PieChartCard title="Listings by type" data={s.byType} />
      </div>
    </div>
  );
}
