import Link from "next/link";
import { ClipboardList, Package, Users, Wallet } from "lucide-react";
import { db } from "@/db";
import { adminOverview, mergeSeries } from "@/lib/dashboard-stats";
import { formatBDT, timeAgo } from "@/lib/utils";
import { PageHeader } from "@/components/ui";
import { StatCard } from "@/components/dashboard/stat-card";
import { BarChartCard, LineChartCard, PieChartCard } from "@/components/charts";

export default async function AdminOverview() {
  const [o, pendingListings, pendingSellers, openReports, unreadMessages, logs] = await Promise.all([
    adminOverview(),
    db.listing.count({ where: { status: "pending" } }),
    db.sellerProfile.count({ where: { verificationStatus: "pending" } }),
    db.report.count({ where: { status: "open" } }),
    db.contactMessage.count({ where: { status: "new" } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const queues = [
    { label: "Listings awaiting review", n: pendingListings, href: "/admin/listings?status=pending" },
    { label: "Seller verifications", n: pendingSellers, href: "/admin/sellers" },
    { label: "Open reports", n: openReports, href: "/admin/reports" },
    { label: "New contact messages", n: unreadMessages, href: "/admin/messages" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Admin overview" description="Live numbers from the marketplace." />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total items" value={o.items} icon={Package} />
        <StatCard label="Total users" value={o.users} icon={Users} tone="teal" />
        <StatCard label="Delivered order value" value={formatBDT(o.revenue)} icon={Wallet} tone="neutral" />
        <StatCard label="Orders + adoption requests" value={o.activity30} hint="last 30 days" icon={ClipboardList} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {queues.map((q) => (
          <Link key={q.href} href={q.href} className="rounded-xl border border-line bg-surface p-4 transition hover:border-brand-300">
            <p className="text-sm text-muted">{q.label}</p>
            <p className={`font-display text-3xl font-bold ${q.n > 0 ? "text-brand-600" : ""}`}>{q.n}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <LineChartCard
          title="Growth"
          description="New users and listings per month"
          data={mergeSeries({ key: "users", points: o.usersMonthly }, { key: "listings", points: o.listingsMonthly })}
          series={[
            { key: "users", name: "New users" },
            { key: "listings", name: "New listings" },
          ]}
        />
        <BarChartCard title="Listings by category" description="Top categories" data={o.byCategory} />
        <PieChartCard title="Listings by status" data={o.byStatus} />
        <PieChartCard title="Users by role" data={o.byRole} />
      </div>

      <section>
        <h2 className="text-h3 mb-3">Recent admin actions</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted">No actions yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0 truncate"><code className="text-xs">{l.action}</code> · {l.targetType} {l.targetId?.slice(0, 8)}</span>
                <span className="shrink-0 text-xs text-muted">{timeAgo(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
