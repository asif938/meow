import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Package, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { searchListings } from "@/lib/queries";
import { updateOrderStatusAction } from "@/actions/orders";
import { formatBDT, timeAgo } from "@/lib/utils";
import { Alert, Badge, Card, EmptyState, PageHeader, buttonClass } from "@/components/ui";
import { ListingGrid } from "@/components/listing-card";
import { ReviewForm } from "@/components/review-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "My account", robots: { index: false } };

type Props = { searchParams: Promise<{ verified?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const { verified } = await searchParams;
  const user = await requireUser("/account");

  const [saved, myOrders, myRequests, myReviews] = await Promise.all([
    db.wishlist.findMany({ where: { userId: user.id }, select: { listingId: true }, orderBy: { createdAt: "desc" } }),
    db.order.findMany({
      where: { buyerId: user.id },
      include: { items: true, seller: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.adoptionRequest.findMany({
      where: { requesterId: user.id },
      include: { listing: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.review.findMany({ where: { reviewerId: user.id }, select: { orderId: true, adoptionRequestId: true } }),
  ]);

  const reviewedOrders = new Set(myReviews.map((r) => r.orderId).filter(Boolean));
  const reviewedAdoptions = new Set(myReviews.map((r) => r.adoptionRequestId).filter(Boolean));

  // Wishlist cards (any status, so buyers can see when something sold).
  const savedIds = saved.map((s) => s.listingId);
  const wishItems = savedIds.length
    ? (await searchListings({ ids: savedIds, limit: 100 })).items
    : [];
  const missing = savedIds.length - wishItems.length;
  const closedSaved =
    missing > 0
      ? await db.listing.findMany({
          where: { id: { in: savedIds }, status: { in: ["sold", "adopted"] } },
          select: { id: true, title: true, slug: true, status: true },
        })
      : [];

  return (
    <div className="container-page py-8">
      <PageHeader title="My account" description={user.email} />
      {verified && <Alert tone="green" className="mb-6">Phone number verified ✓</Alert>}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Profile</h2>
            <ProfileForm name={user.name} bio={user.sellerProfile?.bio ?? ""} shopName={user.sellerProfile?.shopName ?? ""} hasShop={Boolean(user.sellerProfile)} />
          </Card>
          <Card className="space-y-3 p-5 text-sm">
            <h2 className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Verification</h2>
            <p className="flex justify-between">
              <span>Phone</span>
              {user.isPhoneVerified ? (
                <span className="text-emerald-700">{user.phone} ✓</span>
              ) : (
                <Link href="/verify?next=/account" className="font-semibold text-brand-600">Verify</Link>
              )}
            </p>
            <p className="flex justify-between">
              <span>Seller ID</span>
              {user.sellerProfile?.verificationStatus === "approved" ? (
                <span className="text-emerald-700">Verified ✓</span>
              ) : user.sellerProfile?.verificationStatus === "pending" ? (
                <span className="text-muted">In review</span>
              ) : (
                <Link href="/dashboard/shop" className="font-semibold text-brand-600">Get verified</Link>
              )}
            </p>
            <p className="flex justify-between">
              <span>Public profile</span>
              <Link href={`/seller/${user.username}`} className="text-brand-600">@{user.username}</Link>
            </p>
          </Card>
        </div>

        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Heart className="h-5 w-5 text-brand-500" /> Wishlist</h2>
            {wishItems.length === 0 && closedSaved.length === 0 ? (
              <EmptyState title="Nothing saved yet" description="Tap the heart on any listing to save it here." />
            ) : (
              <>
                <ListingGrid items={wishItems} wished={new Set(savedIds)} />
                {closedSaved.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted">
                    {closedSaved.map((l) => (
                      <li key={l.id}>
                        <Link href={`/listing/${l.slug}`} className="hover:underline">{l.title}</Link> — {l.status}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold"><Package className="h-5 w-5" /> My orders</h2>
            {myOrders.length === 0 ? (
              <EmptyState title="No orders yet" action={<Link href="/shop" className={buttonClass()}>Shop supplies</Link>} />
            ) : (
              <ul className="space-y-3">
                {myOrders.map((o) => (
                  <li key={o.id} className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{o.items.map((i) => `${i.quantity} × ${i.title}`).join(", ")}</p>
                        <p className="text-xs text-muted">
                          {formatBDT(o.total)} · COD · from{" "}
                          <Link href={`/seller/${o.seller.username}`} className="underline">{o.seller.name}</Link> · {timeAgo(o.createdAt)}
                        </p>
                      </div>
                      <Badge tone={o.status === "delivered" ? "green" : o.status === "cancelled" ? "red" : "amber"}>{o.status}</Badge>
                    </div>
                    {o.status === "pending" && (
                      <form action={updateOrderStatusAction} className="mt-3">
                        <input type="hidden" name="id" value={o.id} />
                        <button name="status" value="cancelled" className={buttonClass("outline", "sm")}>Cancel order</button>
                      </form>
                    )}
                    {o.status === "delivered" && !reviewedOrders.has(o.id) && <ReviewForm orderId={o.id} />}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-4 font-display text-lg font-bold">My adoption requests</h2>
            {myRequests.length === 0 ? (
              <EmptyState title="No adoption requests" action={<Link href="/adopt" className={buttonClass("teal")}>Find a cat to adopt</Link>} />
            ) : (
              <ul className="space-y-3">
                {myRequests.map((r) => (
                  <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/listing/${r.listing.slug}`} className="font-semibold hover:underline">{r.listing.title}</Link>
                        <p className="text-xs text-muted">{timeAgo(r.createdAt)}</p>
                        {r.ownerNote && <p className="mt-1 text-sm">Owner: “{r.ownerNote}”</p>}
                      </div>
                      <Badge tone={r.status === "approved" || r.status === "completed" ? "green" : r.status === "pending" ? "amber" : "gray"}>{r.status}</Badge>
                    </div>
                    {r.status === "completed" && !reviewedAdoptions.has(r.id) && <ReviewForm adoptionRequestId={r.id} />}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
