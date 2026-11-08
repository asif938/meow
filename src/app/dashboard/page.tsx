import type { Metadata } from "next";
import Link from "next/link";
import { Cat, Plus } from "lucide-react";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { cldTransform } from "@/lib/cloudinary";
import { formatBDT, timeAgo } from "@/lib/utils";
import { Alert, EmptyState, buttonClass } from "@/components/ui";
import { ListingsManager } from "@/components/dashboard/listings-manager";
import { demoCount, demoListings } from "@/lib/perf-data";
import type { ListingRowData } from "@/lib/dashboard-types";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

type Props = { searchParams: Promise<{ saved?: string; demo?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const { saved, demo: demoParam } = await searchParams;
  const user = await requireUser("/dashboard");

  const demo = demoCount(demoParam);
  const dbRows = demo
    ? []
    : await db.listing.findMany({
        where: { sellerId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          slug: true,
          title: true,
          type: true,
          price: true,
          status: true,
          rejectionReason: true,
          viewCount: true,
          stock: true,
          condition: true,
          createdAt: true,
          // Cover photo only.
          images: { select: { url: true }, orderBy: [{ isCover: "desc" }, { position: "asc" }], take: 1 },
        },
      });

  // Serialize + pre-format on the server: the client island receives plain strings and
  // never ships formatBDT/timeAgo/Cloudinary helpers.
  const rows: ListingRowData[] = demo
    ? demoListings(demo)
    : dbRows.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        type: r.type,
        status: r.status,
        condition: r.condition,
        stock: r.stock,
        viewCount: r.viewCount,
        priceLabel: r.type === "adoption" ? null : formatBDT(r.price),
        ageLabel: timeAgo(r.createdAt),
        createdAt: r.createdAt.toISOString(),
        cover: r.images[0] ? cldTransform(r.images[0].url, "f_auto,q_auto,c_fill,w_128,h_128") : null,
        rejectionReason: r.rejectionReason,
      }));

  const stats = {
    active: rows.filter((r) => r.status === "active").length,
    pending: rows.filter((r) => r.status === "pending").length,
    closed: rows.filter((r) => r.status === "sold" || r.status === "adopted").length,
    views: rows.reduce((n, r) => n + r.viewCount, 0),
  };

  return (
    <div className="space-y-6">
      {saved === "active" && <Alert tone="green">Your listing is live! 🎉</Alert>}
      {saved === "pending" && <Alert tone="blue">Saved. Your listing is waiting for moderator review.</Alert>}
      {saved === "draft" && <Alert tone="blue">Draft saved.</Alert>}
      {!user.isPhoneVerified && (
        <Alert tone="amber">
          Verify your phone number to start posting. <Link href="/verify?next=/dashboard" className="font-semibold underline">Verify now</Link>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Active", stats.active],
          ["In review", stats.pending],
          ["Sold / adopted", stats.closed],
          ["Total views", stats.views],
        ].map(([label, n]) => (
          <div key={label} className="rounded-2xl border border-line bg-white p-4">
            <p className="text-xs text-muted">{label}</p>
            <p className="font-display text-2xl font-bold">{n}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold">My listings</h2>
        <Link href="/sell/new" className={buttonClass("primary", "sm")}>
          <Plus className="h-4 w-4" /> New listing
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Cat className="h-10 w-10" />}
          title="No listings yet"
          description="Post your first ad — sell used cat supplies or find a loving home for a cat."
          action={<Link href="/sell/new" className={buttonClass()}>Post an ad</Link>}
        />
      ) : (
        <ListingsManager rows={rows} />
      )}
    </div>
  );
}
