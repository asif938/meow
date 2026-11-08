import Link from "next/link";
import { db } from "@/db";
import { timeAgo } from "@/lib/utils";
import { Card } from "@/components/ui";

export default async function AdminOverview() {
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);

  const [pendingListings, pendingSellers, openReports, activeListings, verifiedSellers, totalUsers, ordersMonth, adoptionsMonth, logs] =
    await Promise.all([
      db.listing.count({ where: { status: "pending" } }),
      db.sellerProfile.count({ where: { verificationStatus: "pending" } }),
      db.report.count({ where: { status: "open" } }),
      db.listing.count({ where: { status: "active" } }),
      db.sellerProfile.count({ where: { verificationStatus: "approved" } }),
      db.user.count(),
      db.order.count({ where: { createdAt: { gt: monthAgo } } }),
      db.adoptionRequest.count({ where: { status: "completed", updatedAt: { gt: monthAgo } } }),
      db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
    ]);

  const queues = [
    { label: "Listings awaiting review", n: pendingListings, href: "/admin/listings" },
    { label: "Seller verifications", n: pendingSellers, href: "/admin/sellers" },
    { label: "Open reports", n: openReports, href: "/admin/reports" },
  ];
  const kpis = [
    { label: "Active listings", n: activeListings, goal: 500 },
    { label: "Verified sellers", n: verifiedSellers, goal: 50 },
    { label: "Orders + adoptions (30d)", n: ordersMonth + adoptionsMonth, goal: 100 },
    { label: "Users", n: totalUsers },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {queues.map((q) => (
          <Link key={q.href} href={q.href} className="rounded-2xl border border-line bg-white p-5 hover:border-brand-300">
            <p className="text-sm text-muted">{q.label}</p>
            <p className={`font-display text-3xl font-bold ${q.n > 0 ? "text-brand-600" : ""}`}>{q.n}</p>
          </Link>
        ))}
      </div>

      <div>
        <h2 className="mb-3 font-semibold">MVP success metrics</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label} className="p-4">
              <p className="text-xs text-muted">{k.label}</p>
              <p className="font-display text-2xl font-bold">
                {k.n}
                {k.goal && <span className="text-sm font-normal text-muted"> / {k.goal}</span>}
              </p>
              {k.goal && (
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, (k.n / k.goal) * 100)}%` }} />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-semibold">Recent admin actions</h2>
        {logs.length === 0 ? (
          <p className="text-sm text-muted">No actions yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex justify-between gap-3 px-4 py-2.5">
                <span><code className="text-xs">{l.action}</code> · {l.targetType} {l.targetId?.slice(0, 8)}</span>
                <span className="shrink-0 text-xs text-muted">{timeAgo(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
