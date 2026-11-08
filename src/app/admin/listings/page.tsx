import Link from "next/link";
import Image from "next/image";
import { db } from "@/db";
import type { ListingStatus } from "@/db/types";
import { moderateListingAction } from "@/actions/admin";
import { cldTransform } from "@/lib/cloudinary";
import { findBannedWords } from "@/lib/moderation";
import { formatAge, formatBDT, timeAgo } from "@/lib/utils";
import { Badge, EmptyState, Input, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

const STATUSES: ListingStatus[] = ["pending", "active", "rejected", "sold", "adopted", "draft"];

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminListingsPage({ searchParams }: Props) {
  const { status: raw } = await searchParams;
  const status = STATUSES.find((s) => s === raw) ?? "pending";

  const rows = await db.listing.findMany({
    where: { status },
    include: {
      images: { take: 4, orderBy: { position: "asc" } },
      catDetails: true,
      category: { select: { name: true } },
      seller: { select: { name: true, username: true, sellerProfile: { select: { verificationStatus: true, type: true } } } },
    },
    // Oldest first for the review queue, newest first everywhere else.
    orderBy: { createdAt: status === "pending" ? "asc" : "desc" },
    take: 50,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/listings?status=${s}`} className={cn(buttonClass(s === status ? "primary" : "outline", "sm"), "capitalize")}>
            {s}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState title={`No ${status} listings`} description="All caught up 🎉" />
      ) : (
        <ul className="space-y-3">
          {rows.map((l) => {
            const flags = findBannedWords(l.title, l.description);
            return (
              <li key={l.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-col gap-4 md:flex-row">
                  <div className="flex shrink-0 gap-1.5">
                    {l.images.map((img) => (
                      <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="relative h-20 w-20 overflow-hidden rounded-lg bg-stone-100">
                        <Image src={cldTransform(img.url, "f_auto,q_auto,c_fill,w_160,h_160")} alt="" fill sizes="80px" className="object-cover" />
                      </a>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand" className="capitalize">{l.type}</Badge>
                      {l.condition && <Badge>{l.condition}</Badge>}
                      <span className="text-xs text-muted">{l.category.name} · {timeAgo(l.createdAt)}</span>
                      {l.isFeatured && <Badge tone="amber">Featured</Badge>}
                    </div>
                    <Link href={`/listing/${l.slug}`} className="block font-semibold hover:underline">{l.title}</Link>
                    <p className="text-muted">
                      {l.type === "adoption" ? `Fee ${formatBDT(l.catDetails?.adoptionFee ?? 0)}` : formatBDT(l.price)} · by{" "}
                      <Link href={`/seller/${l.seller.username}`} className="underline">{l.seller.name}</Link>{" "}
                      ({l.seller.sellerProfile?.verificationStatus === "approved" ? `verified ${l.seller.sellerProfile.type}` : "unverified"})
                    </p>
                    {l.catDetails && (
                      <p className="text-muted">
                        {l.catDetails.breed} · {formatAge(l.catDetails.ageMonths)} · {l.catDetails.vaccinated ? "vaccinated" : "NOT vaccinated"} · Health: {l.catDetails.healthNote}
                      </p>
                    )}
                    <p className="line-clamp-2 text-muted">{l.description}</p>
                    {flags.length > 0 && <p className="text-xs font-semibold text-red-600">Flagged words: {flags.join(", ")}</p>}
                    {l.rejectionReason && <p className="text-xs text-red-600">Reason: {l.rejectionReason}</p>}
                  </div>
                  <form action={moderateListingAction} className="flex shrink-0 flex-col gap-2 md:w-56">
                    <input type="hidden" name="id" value={l.id} />
                    {l.status !== "active" && (
                      <button name="decision" value="approve" className={buttonClass("teal", "sm")}>Approve</button>
                    )}
                    {l.status !== "rejected" && (
                      <>
                        <Input name="reason" placeholder="Rejection reason" className="h-9" />
                        <button name="decision" value="reject" className={buttonClass("danger", "sm")}>Reject / take down</button>
                      </>
                    )}
                    {l.status === "active" && (
                      <button name="decision" value={l.isFeatured ? "unfeature" : "feature"} className={buttonClass("outline", "sm")}>
                        {l.isFeatured ? "Unfeature" : "Feature on home"}
                      </button>
                    )}
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
