import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  Eye,
  MapPin,
  MessageCircle,
  Pencil,
  ShieldAlert,
  Star,
} from "lucide-react";
import { db } from "@/db";
import { getListingBySlug, getSellerRating, searchListings } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { cldTransform } from "@/lib/cloudinary";
import { formatAge, formatBDT, timeAgo } from "@/lib/utils";
import { Alert, Badge, Card, buttonClass } from "@/components/ui";
import { Gallery } from "@/components/gallery";
import { WishlistButton } from "@/components/wishlist-button";
import { ReportButton } from "@/components/report-button";
import { ListingGrid } from "@/components/listing-card";
import { SubmitButton } from "@/components/submit-button";
import { startConversationAction } from "@/actions/chat";
import { AdoptionRequestForm } from "./adoption-request-form";
import { OrderForm } from "./order-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListingBySlug((await params).slug).catch(() => null);
  if (!listing || listing.status !== "active") return { title: "Listing" };
  const price = listing.type === "adoption" ? "Adoption" : formatBDT(listing.price);
  const place = listing.location ? `${listing.location.district}` : "Bangladesh";
  const description = `${price} · ${place} — ${(listing.description ?? "").slice(0, 140)}`;
  const image = listing.images[0]?.url;
  return {
    title: listing.title,
    description,
    alternates: { canonical: `/listing/${listing.slug}` },
    openGraph: { title: listing.title, description, images: image ? [cldTransform(image, "f_auto,q_auto,w_1200")] : [] },
  };
}

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getListingBySlug(slug);
  if (!listing) notFound();

  const user = await getCurrentUser();
  const isOwner = user?.id === listing.sellerId;
  const visible = ["active", "sold", "adopted"].includes(listing.status);
  if (!visible && !isOwner && !user?.isAdmin) notFound();

  if (!isOwner && listing.status === "active") {
    // Fire-and-forget view counter.
    db.listing
      .update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } })
      .catch(() => {});
  }

  const sp = listing.seller.sellerProfile;
  const sellerVerified = sp?.verificationStatus === "approved";
  const [rating, wished, myRequest, similar] = await Promise.all([
    getSellerRating(listing.sellerId),
    user
      ? db.wishlist.findUnique({ where: { userId_listingId: { userId: user.id, listingId: listing.id } } })
      : null,
    user && listing.type === "adoption"
      ? db.adoptionRequest.findUnique({
          where: { listingId_requesterId: { listingId: listing.id, requesterId: user.id } },
        })
      : null,
    searchListings({ type: listing.type, category: listing.category.slug, limit: 4 }),
  ]);

  const cd = listing.catDetails;
  const isCat = listing.type !== "supply";
  const isAdoption = listing.type === "adoption";
  const attrs = listing.attributes as { brand?: string; expiryDate?: string; conditionNote?: string; isSealed?: boolean };
  const canOrder =
    listing.type === "supply" && listing.status === "active" && sellerVerified && sp?.type === "business" && listing.stock > 0;
  const approvedAdoption = myRequest?.status === "approved" || myRequest?.status === "completed";

  const info: [string, React.ReactNode][] = isCat && cd
    ? [
        ["Breed", cd.breed],
        ["Age", formatAge(cd.ageMonths)],
        ["Gender", cd.gender === "male" ? "Male" : "Female"],
        ["Color", cd.color || "—"],
        ["Vaccinated", cd.vaccinated ? <span className="font-medium text-emerald-700">Yes</span> : <span className="text-red-600">No</span>],
        ["Neutered / spayed", cd.neutered ? "Yes" : "No"],
      ]
    : [
        ["Condition", listing.condition === "new" ? "New" : "Used"],
        ["Category", listing.category.name],
        ...(attrs.brand ? ([["Brand", attrs.brand]] as [string, string][]) : []),
        ...(attrs.expiryDate ? ([["Expiry date", new Date(attrs.expiryDate).toLocaleDateString("en-GB")]] as [string, string][]) : []),
        ...(listing.condition === "new" ? ([["In stock", String(listing.stock)]] as [string, string][]) : []),
        ...(attrs.isSealed ? ([["Packaging", "Sealed / unopened"]] as [string, string][]) : []),
      ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: listing.title,
    description: listing.description,
    image: listing.images.map((i) => i.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: isAdoption ? cd?.adoptionFee ?? 0 : listing.price,
      availability: listing.status === "active" ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
      itemCondition: listing.condition === "used" ? "https://schema.org/UsedCondition" : "https://schema.org/NewCondition",
    },
  };

  const chatButton = !isOwner && listing.status === "active" && (
    <form action={startConversationAction}>
      <input type="hidden" name="listingId" value={listing.id} />
      <SubmitButton variant={isAdoption ? "outline" : "primary"} size="lg" className="w-full">
        <MessageCircle className="h-5 w-5" /> Chat with {isAdoption ? "owner" : "seller"}
      </SubmitButton>
    </form>
  );

  return (
    <div className="container-page py-6 pb-28 lg:pb-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        {" / "}
        <Link href={isAdoption ? "/adopt" : listing.type === "cat" ? "/cats" : "/shop"} className="hover:text-ink">
          {isAdoption ? "Adopt" : listing.type === "cat" ? "Cats" : "Shop"}
        </Link>
        {" / "}
        <Link href={`/category/${listing.category.slug}`} className="hover:text-ink">{listing.category.name}</Link>
      </nav>

      {listing.status !== "active" && (
        <Alert tone={listing.status === "rejected" ? "red" : "amber"} className="mb-4">
          {listing.status === "pending" && "This listing is awaiting review by our moderators. Only you can see it."}
          {listing.status === "draft" && "This is a draft. Publish it from your dashboard."}
          {listing.status === "rejected" && `This listing was rejected${listing.rejectionReason ? `: ${listing.rejectionReason}` : "."}`}
          {listing.status === "sold" && "This item has been sold."}
          {listing.status === "adopted" && "This cat has found a home. 🎉"}
        </Alert>
      )}

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Gallery images={listing.images.map((i) => i.url)} title={listing.title} videoUrl={listing.videoUrl} />

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {isAdoption && <Badge tone="teal">Adoption</Badge>}
              {listing.type === "cat" && <Badge tone="brand">Cat for sale</Badge>}
              {listing.condition && <Badge tone={listing.condition === "new" ? "green" : "gray"}>{listing.condition === "new" ? "New" : "Used"}</Badge>}
              {sellerVerified && (
                <Badge tone="blue"><BadgeCheck className="h-3.5 w-3.5" /> Verified seller</Badge>
              )}
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">{listing.title}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {listing.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {[listing.location.area, listing.location.district, listing.location.division].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="inline-flex items-center gap-1"><Calendar className="h-4 w-4" /> {timeAgo(listing.publishedAt ?? listing.createdAt)}</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-4 w-4" /> {listing.viewCount} views</span>
            </div>
          </div>

          <Card className="overflow-hidden">
            <dl className="grid grid-cols-2 sm:grid-cols-3">
              {info.map(([k, v]) => (
                <div key={k} className="border-b border-r border-line p-4 last:border-r-0">
                  <dt className="text-xs uppercase tracking-wide text-muted">{k}</dt>
                  <dd className="mt-0.5 font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          {isCat && cd && (
            <Card className="space-y-3 p-5">
              <h2 className="font-display text-lg font-bold">Health & vaccines</h2>
              <p className="whitespace-pre-line text-sm">{cd.healthNote}</p>
              {cd.vaccineNote && (
                <p className="text-sm"><span className="font-medium">Vaccine record:</span> {cd.vaccineNote}</p>
              )}
            </Card>
          )}

          <Card className="p-5">
            <h2 className="mb-2 font-display text-lg font-bold">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed">{listing.description}</p>
            {attrs.conditionNote && (
              <p className="mt-3 text-sm"><span className="font-medium">Condition note:</span> {attrs.conditionNote}</p>
            )}
          </Card>

          {isCat && (
            <Card className="border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
              <h2 className="mb-2 flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4" /> Safety checklist</h2>
              <ul className="list-disc space-y-1 pl-5">
                <li>Kitten should be at least 8 weeks old — ask for the birth date.</li>
                <li>Ask to see the vaccine card and any vet records.</li>
                <li>Meet in a public place or visit with a friend.</li>
                <li>Never pay an advance before seeing the cat in person.</li>
                <li>Keep your chat on Meow so we can help if something goes wrong.</li>
              </ul>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-4 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                {isAdoption ? (
                  <>
                    <p className="font-display text-2xl font-extrabold text-teal-700">
                      {cd?.adoptionFee ? formatBDT(cd.adoptionFee) : "Free"}
                    </p>
                    <p className="text-xs text-muted">{cd?.adoptionFee ? "Rehoming fee (covers vaccines/care)" : "No adoption fee"}</p>
                  </>
                ) : (
                  <>
                    <p className="font-display text-3xl font-extrabold text-brand-600">{formatBDT(listing.price)}</p>
                    {listing.isNegotiable && <p className="text-xs text-muted">Price is negotiable</p>}
                  </>
                )}
              </div>
              {!isOwner && <WishlistButton listingId={listing.id} initial={Boolean(wished)} large />}
            </div>

            {isOwner ? (
              <div className="space-y-2">
                <Link href={`/dashboard/listings/${listing.id}/edit`} className={buttonClass("primary", "lg", "w-full")}>
                  <Pencil className="h-4 w-4" /> Edit listing
                </Link>
                <Link href="/dashboard" className={buttonClass("outline", "md", "w-full")}>Manage in dashboard</Link>
              </div>
            ) : listing.status === "active" ? (
              <div className="hidden space-y-2 lg:block">
                {chatButton}
              </div>
            ) : null}

            {!isOwner && isAdoption && listing.status === "active" && (
              <div id="adopt">
                {myRequest ? (
                  <Alert tone={myRequest.status === "approved" ? "green" : myRequest.status === "rejected" ? "red" : "blue"}>
                    Your adoption request is <strong>{myRequest.status}</strong>.
                    {myRequest.status === "approved" && " The owner's contact is shown below."}
                  </Alert>
                ) : user ? (
                  <AdoptionRequestForm listingId={listing.id} />
                ) : (
                  <Link href={`/login?next=/listing/${listing.slug}`} className={buttonClass("teal", "lg", "w-full")}>
                    Log in to request adoption
                  </Link>
                )}
              </div>
            )}

            {!isOwner && canOrder && (
              user ? (
                <OrderForm listingId={listing.id} price={listing.price} stock={listing.stock} defaultName={user.name} defaultPhone={user.phone ?? ""} />
              ) : (
                <Link href={`/login?next=/listing/${listing.slug}`} className={buttonClass("teal", "lg", "w-full")}>
                  Log in to order (Cash on delivery)
                </Link>
              )
            )}
          </Card>

          {/* Seller card */}
          <Card className="p-5">
            <Link href={`/seller/${listing.seller.username}`} className="flex items-center gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-lg font-bold text-brand-700">
                {listing.seller.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.seller.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  (sp?.shopName ?? listing.seller.name).charAt(0)
                )}
              </span>
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-semibold">
                  <span className="truncate">{sp?.shopName ?? listing.seller.name}</span>
                  {sellerVerified && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-600" aria-label="Verified" />}
                </span>
                <span className="block text-xs text-muted">
                  {sp?.type === "business" ? "Business seller" : sp?.type === "shelter" ? "Shelter / rescuer" : "Individual seller"} · Member since{" "}
                  {new Date(listing.seller.createdAt).getFullYear()}
                </span>
                {rating.count > 0 && (
                  <span className="mt-0.5 inline-flex items-center gap-1 text-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {rating.avg} ({rating.count} reviews)
                  </span>
                )}
              </span>
            </Link>
            {listing.seller.isPhoneVerified && <p className="mt-3 text-xs text-emerald-700">✓ Phone number verified</p>}
            {approvedAdoption && listing.seller.phone && (
              <Alert tone="green" className="mt-3">
                Owner&apos;s phone: <a href={`tel:${listing.seller.phone}`} className="font-semibold underline">{listing.seller.phone}</a>
              </Alert>
            )}
          </Card>

          {!isOwner && (
            <div className="flex justify-center">
              <ReportButton targetType="listing" targetId={listing.id} loggedIn={Boolean(user)} />
            </div>
          )}
        </aside>
      </div>

      {similar.items.filter((i) => i.id !== listing.id).length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 font-display text-xl font-bold">Similar listings</h2>
          <ListingGrid items={similar.items.filter((i) => i.id !== listing.id).slice(0, 4)} />
        </section>
      )}

      {/* Sticky mobile CTA */}
      {!isOwner && listing.status === "active" && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-line bg-white/95 p-3 backdrop-blur lg:hidden">
          <div className="flex-1">{chatButton}</div>
          {isAdoption && !myRequest && (
            <a href="#adopt" className={buttonClass("teal", "lg", "flex-1")}>Adopt</a>
          )}
          {canOrder && (
            <a href="#order" className={buttonClass("teal", "lg", "flex-1")}>Order</a>
          )}
        </div>
      )}
    </div>
  );
}
