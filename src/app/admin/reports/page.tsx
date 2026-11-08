import Link from "next/link";
import { db } from "@/db";
import { resolveReportAction } from "@/actions/admin";
import { timeAgo } from "@/lib/utils";
import { Badge, EmptyState, Input, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminReportsPage({ searchParams }: Props) {
  const { status: raw } = await searchParams;
  const status = raw === "resolved" || raw === "dismissed" ? raw : "open";

  const rows = await db.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const listingIds = rows.filter((r) => r.targetType === "listing").map((r) => r.targetId);
  const userIds = [...rows.filter((r) => r.targetType === "user").map((r) => r.targetId), ...rows.map((r) => r.reporterId)];
  const [listingRows, userRows] = await Promise.all([
    listingIds.length ? db.listing.findMany({ where: { id: { in: listingIds } }, select: { id: true, title: true, slug: true, status: true } }) : [],
    userIds.length ? db.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, username: true, status: true } }) : [],
  ]);
  const listingMap = new Map(listingRows.map((l) => [l.id, l]));
  const userMap = new Map(userRows.map((u) => [u.id, u]));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["open", "resolved", "dismissed"].map((s) => (
          <Link key={s} href={`/admin/reports?status=${s}`} className={cn(buttonClass(s === status ? "primary" : "outline", "sm"), "capitalize")}>
            {s}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={`No ${status} reports`} />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const listing = r.targetType === "listing" ? listingMap.get(r.targetId) : undefined;
            const target = r.targetType === "user" ? userMap.get(r.targetId) : undefined;
            const reporter = userMap.get(r.reporterId);
            return (
              <li key={r.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 md:flex-row">
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge tone="red">{r.reason}</Badge>
                    <span className="text-xs text-muted">{timeAgo(r.createdAt)} · by {reporter?.name ?? "unknown"}</span>
                  </div>
                  <p>
                    {r.targetType === "listing" ? (
                      listing ? (
                        <>Listing: <Link href={`/listing/${listing.slug}`} className="font-semibold underline">{listing.title}</Link> ({listing.status})</>
                      ) : (
                        "Listing (deleted)"
                      )
                    ) : target ? (
                      <>User: <Link href={`/seller/${target.username}`} className="font-semibold underline">{target.name}</Link> ({target.status})</>
                    ) : (
                      "User (deleted)"
                    )}
                  </p>
                  {r.details && <p className="text-muted">“{r.details}”</p>}
                  {r.resolutionNote && <p className="text-xs text-muted">Note: {r.resolutionNote}</p>}
                </div>
                {status === "open" && (
                  <form action={resolveReportAction} className="flex shrink-0 flex-col gap-2 md:w-60">
                    <input type="hidden" name="id" value={r.id} />
                    <Input name="note" placeholder="Resolution note" className="h-9" />
                    <label className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name="takedown" value="1" className="accent-red-600" />
                      {r.targetType === "listing" ? "Take down listing" : "Ban user"}
                    </label>
                    <div className="flex gap-2">
                      <button name="decision" value="resolved" className={buttonClass("primary", "sm", "flex-1")}>Resolve</button>
                      <button name="decision" value="dismissed" className={buttonClass("outline", "sm", "flex-1")}>Dismiss</button>
                    </div>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
