import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, Star, Store } from "lucide-react";
import { db } from "@/db";
import { getSellerByUsername, getSellerRating, getWishedIds, searchListings } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { timeAgo } from "@/lib/utils";
import { Badge, Card, EmptyState } from "@/components/ui";
import { ListingGrid } from "@/components/listing-card";
import { ReportButton } from "@/components/report-button";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const seller = await getSellerByUsername((await params).username).catch(() => null);
  if (!seller) return { title: "Seller" };
  const name = seller.sellerProfile?.shopName ?? seller.name;
  return { title: name, description: seller.sellerProfile?.bio ?? `${name} on Meow — cats & cat supplies in Bangladesh.` };
}

export default async function SellerPage({ params }: Props) {
  const { username } = await params;
  const seller = await getSellerByUsername(username);
  if (!seller || seller.status === "banned") notFound();

  const [listingsRes, rating, recentReviews, viewer] = await Promise.all([
    searchListings({ sellerId: seller.id, limit: 48 }),
    getSellerRating(seller.id),
    db.review.findMany({
      where: { sellerId: seller.id },
      include: { reviewer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getCurrentUser(),
  ]);
  const wished = viewer ? await getWishedIds(viewer.id, listingsRes.items.map((i) => i.id)) : undefined;

  const sp = seller.sellerProfile;
  const verified = sp?.verificationStatus === "approved";
  const name = sp?.shopName ?? seller.name;

  return (
    <div className="container-page py-8">
      <Card className="mb-8 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-brand-200 via-brand-100 to-teal-100 sm:h-32" />
        <div className="-mt-10 flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div className="flex items-end gap-4">
            <span className="grid h-20 w-20 place-items-center overflow-hidden rounded-3xl border-4 border-white bg-brand-500 text-3xl font-bold text-white shadow">
              {seller.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={seller.avatar} alt="" className="h-full w-full object-cover" />
              ) : sp?.type === "business" ? (
                <Store className="h-8 w-8" />
              ) : (
                name.charAt(0)
              )}
            </span>
            <div>
              <h1 className="flex items-center gap-1.5 font-display text-2xl font-bold">
                {name}
                {verified && <BadgeCheck className="h-6 w-6 text-sky-600" aria-label="Verified" />}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
                {sp?.type === "business" && <Badge tone="brand">Shop</Badge>}
                {sp?.type === "shelter" && <Badge tone="teal">Shelter / rescuer</Badge>}
                {verified && <Badge tone="blue">Verified</Badge>}
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> Joined {new Date(seller.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                {rating.count > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {rating.avg} · {rating.count} review{rating.count > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          {viewer?.id !== seller.id && <ReportButton targetType="user" targetId={seller.id} loggedIn={Boolean(viewer)} />}
        </div>
        {sp?.bio && <p className="whitespace-pre-line px-5 pb-6 text-sm sm:px-6">{sp.bio}</p>}
      </Card>

      <h2 className="mb-4 font-display text-xl font-bold">Active listings ({listingsRes.total})</h2>
      {listingsRes.items.length ? <ListingGrid items={listingsRes.items} wished={wished} /> : <EmptyState title="No active listings right now" />}

      {recentReviews.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 font-display text-xl font-bold">Reviews</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {recentReviews.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{r.reviewer.name}</span>
                  <span className="flex" aria-label={`${r.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={i < r.rating ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4 text-stone-300"} />
                    ))}
                  </span>
                </div>
                {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
                <p className="mt-1 text-xs text-muted">{timeAgo(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
