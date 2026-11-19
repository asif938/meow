import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { moderateListingAction } from "@/actions/admin";
import { cldTransform } from "@/lib/cloudinary";
import { findBannedWords } from "@/lib/moderation";
import { formatAge, formatBDT, timeAgo } from "@/lib/utils";
import { Badge, Card, Input, buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Moderate listing", robots: { index: false } };

export default async function AdminListingDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const l = await db.listing.findUnique({
    where: { id },
    include: {
      images: { orderBy: { position: "asc" } },
      catDetails: true,
      category: { select: { name: true } },
      seller: { select: { name: true, username: true, sellerProfile: { select: { verificationStatus: true, type: true } } } },
    },
  });
  if (!l) notFound();
  const flags = findBannedWords(l.title, l.description);

  return (
    <div className="space-y-5">
      <Link href="/admin/listings" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to items
      </Link>
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand" className="capitalize">{l.type}</Badge>
          <Badge className="capitalize">{l.status}</Badge>
          {l.condition && <Badge>{l.condition}</Badge>}
          {l.isFeatured && <Badge tone="amber">Featured</Badge>}
          <span className="text-xs text-muted">{l.category.name} · {timeAgo(l.createdAt)}</span>
        </div>
        <h1 className="text-h2">{l.title}</h1>
        <p className="text-sm text-muted">
          {l.type === "adoption" ? `Fee ${formatBDT(l.catDetails?.adoptionFee ?? 0)}` : formatBDT(l.price)} · by{" "}
          <Link href={`/seller/${l.seller.username}`} className="underline">{l.seller.name}</Link>{" "}
          ({l.seller.sellerProfile?.verificationStatus === "approved" ? `verified ${l.seller.sellerProfile.type}` : "unverified"})
        </p>
        {l.images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {l.images.map((img) => (
              <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="relative h-24 w-24 overflow-hidden rounded-xl bg-stone-100">
                <Image src={cldTransform(img.url, "f_auto,q_auto,c_fill,w_200,h_200")} alt="" fill sizes="96px" className="object-cover" />
              </a>
            ))}
          </div>
        )}
        {l.catDetails && (
          <p className="text-sm text-muted">
            {l.catDetails.breed} · {formatAge(l.catDetails.ageMonths)} · {l.catDetails.vaccinated ? "vaccinated" : "NOT vaccinated"} · Health: {l.catDetails.healthNote}
          </p>
        )}
        <p className="whitespace-pre-line text-sm">{l.description}</p>
        {flags.length > 0 && <p className="text-sm font-semibold text-red-600 dark:text-red-400">Flagged words: {flags.join(", ")}</p>}
        {l.rejectionReason && <p className="text-sm text-red-600 dark:text-red-400">Reason: {l.rejectionReason}</p>}
      </Card>

      <Card className="p-5">
        <h2 className="text-h3 mb-3">Moderation</h2>
        <form action={moderateListingAction} className="flex max-w-md flex-col gap-2">
          <input type="hidden" name="id" value={l.id} />
          {l.status !== "active" && <button name="decision" value="approve" className={buttonClass("teal", "md")}>Approve</button>}
          {l.status !== "rejected" && (
            <>
              <label htmlFor="reason" className="sr-only">Rejection reason</label>
              <Input id="reason" name="reason" placeholder="Rejection reason" />
              <button name="decision" value="reject" className={buttonClass("danger", "md")}>Reject / take down</button>
            </>
          )}
          {l.status === "active" && (
            <button name="decision" value={l.isFeatured ? "unfeature" : "feature"} className={buttonClass("outline", "md")}>
              {l.isFeatured ? "Unfeature" : "Feature on home"}
            </button>
          )}
        </form>
      </Card>
    </div>
  );
}
