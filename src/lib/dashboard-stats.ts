import "server-only";
import { db, Prisma } from "@/db";

export type MonthPoint = { label: string; value: number };

type Source = "listings" | "users" | "orders";
const DATE_COL: Record<Source, string> = { listings: "created_at", users: "created_at", orders: "created_at" };

/** Counts rows per month for the last 6 months (zero-filled), optionally scoped to one seller. */
export async function monthlyCounts(source: Source, opts: { sellerId?: string } = {}): Promise<MonthPoint[]> {
  const table = Prisma.raw(source);
  const col = Prisma.raw(DATE_COL[source]);
  const scope =
    opts.sellerId && source !== "users"
      ? Prisma.sql`where seller_id = ${opts.sellerId}::uuid`
      : Prisma.empty;
  const rows = await db.$queryRaw<{ label: string; value: number }[]>(Prisma.sql`
    select to_char(m, 'Mon') as label, coalesce(c.n, 0)::int as value
    from generate_series(date_trunc('month', now()) - interval '5 months', date_trunc('month', now()), interval '1 month') m
    left join (
      select date_trunc('month', ${col}) as d, count(*) as n from ${table} ${scope} group by 1
    ) c on c.d = m
    order by m
  `);
  return rows;
}

export function mergeSeries(...series: { key: string; points: MonthPoint[] }[]) {
  return series[0].points.map((p, i) => {
    const row: { label: string } & Record<string, number | string> = { label: p.label };
    for (const s of series) row[s.key] = s.points[i]?.value ?? 0;
    return row;
  });
}

export async function sellerOverview(userId: string) {
  const [byStatus, byType, topViewed, orders, requests, saved, listingsMonthly, views] = await Promise.all([
    db.listing.groupBy({ by: ["status"], where: { sellerId: userId }, _count: true }),
    db.listing.groupBy({ by: ["type"], where: { sellerId: userId }, _count: true }),
    db.listing.findMany({ where: { sellerId: userId, viewCount: { gt: 0 } }, orderBy: { viewCount: "desc" }, take: 6, select: { title: true, viewCount: true } }),
    db.order.aggregate({ where: { sellerId: userId }, _count: true, _sum: { total: true } }),
    db.adoptionRequest.count({ where: { listing: { sellerId: userId }, status: "pending" } }),
    db.wishlist.count({ where: { listing: { sellerId: userId } } }),
    monthlyCounts("listings", { sellerId: userId }),
    db.listing.aggregate({ where: { sellerId: userId }, _sum: { viewCount: true } }),
  ]);
  const revenue = await db.order.aggregate({ where: { sellerId: userId, status: "delivered" }, _sum: { total: true } });
  return {
    byStatus: byStatus.map((s) => ({ label: s.status, value: s._count })),
    byType: byType.map((s) => ({ label: s.type, value: s._count })),
    topViewed: topViewed.map((l) => ({ label: l.title, value: l.viewCount })),
    orderCount: orders._count,
    revenue: revenue._sum.total ?? 0,
    pendingRequests: requests,
    saves: saved,
    listingsMonthly,
    views: views._sum.viewCount ?? 0,
    total: byStatus.reduce((n, s) => n + s._count, 0),
    active: byStatus.find((s) => s.status === "active")?._count ?? 0,
  };
}

export async function adminOverview() {
  const monthAgo = new Date(Date.now() - 30 * 86_400_000);
  const [items, users, revenue, orders30, adoptions30, byStatus, byCategory, usersMonthly, listingsMonthly, byRole, categories] = await Promise.all([
    db.listing.count(),
    db.user.count(),
    db.order.aggregate({ where: { status: "delivered" }, _sum: { total: true } }),
    db.order.count({ where: { createdAt: { gt: monthAgo } } }),
    db.adoptionRequest.count({ where: { createdAt: { gt: monthAgo } } }),
    db.listing.groupBy({ by: ["status"], _count: true }),
    db.listing.groupBy({ by: ["categoryId"], _count: true }),
    monthlyCounts("users"),
    monthlyCounts("listings"),
    db.userRole.groupBy({ by: ["role"], _count: true }),
    db.category.findMany({ select: { id: true, name: true, parentId: true } }),
  ]);

  // Roll sub-category counts up to their top-level category.
  const byId = new Map(categories.map((c) => [c.id, c]));
  const top = (id: string): string => {
    let c = byId.get(id);
    while (c?.parentId) c = byId.get(c.parentId);
    return c?.name ?? "Other";
  };
  const rolled = new Map<string, number>();
  for (const row of byCategory) rolled.set(top(row.categoryId), (rolled.get(top(row.categoryId)) ?? 0) + row._count);

  return {
    items,
    users,
    revenue: revenue._sum.total ?? 0,
    activity30: orders30 + adoptions30,
    byStatus: byStatus.map((s) => ({ label: s.status, value: s._count })),
    byCategory: [...rolled.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8),
    usersMonthly,
    listingsMonthly,
    byRole: byRole.map((r) => ({ label: r.role, value: r._count })),
  };
}
