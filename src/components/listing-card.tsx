import Link from "next/link";
import Image from "next/image";
import { BadgeCheck, Cat, MapPin, Syringe } from "lucide-react";
import { Badge } from "@/components/ui";
import { cldTransform } from "@/lib/cloudinary";
import { formatAge, formatBDT, timeAgo } from "@/lib/utils";
import type { ListingCard as Card } from "@/lib/queries";
import { WishlistButton } from "./wishlist-button";

export function ListingCard({ item, wished }: { item: Card; wished?: boolean }) {
  const isAdoption = item.type === "adoption";
  const priceLabel = isAdoption
    ? item.adoptionFee
      ? `Rehoming fee ${formatBDT(item.adoptionFee)}`
      : "Free adoption"
    : formatBDT(item.price);

  return (
    <article className="group relative overflow-hidden rounded-[var(--radius-card)] border border-line bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-900/5">
      <Link href={`/listing/${item.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden bg-brand-50">
          {item.cover ? (
            <Image
              src={cldTransform(item.cover, "f_auto,q_auto,c_fill,w_600,h_450")}
              alt={item.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid h-full place-items-center text-brand-300">
              <Cat className="h-14 w-14" aria-hidden />
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-wrap gap-1">
            {isAdoption && <Badge tone="teal" className="bg-teal-600 text-white">Adoption</Badge>}
            {item.condition === "new" && <Badge tone="green" className="bg-emerald-600 text-white">New</Badge>}
            {item.condition === "used" && <Badge className="bg-white/90">Used</Badge>}
            {item.status === "sold" && <Badge className="bg-ink text-white">Sold</Badge>}
            {item.status === "adopted" && <Badge className="bg-ink text-white">Adopted</Badge>}
          </div>
        </div>
        <div className="space-y-1.5 p-3">
          <h3 className="line-clamp-1 text-sm font-semibold leading-snug sm:text-base">{item.title}</h3>
          <p className={isAdoption ? "text-sm font-semibold text-teal-700" : "font-display text-lg font-bold text-brand-600"}>
            {priceLabel}
            {item.isNegotiable && !isAdoption && <span className="ml-1.5 text-xs font-normal text-muted">Negotiable</span>}
          </p>
          {item.breed && (
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
              <span>{item.breed}</span>
              {item.ageMonths != null && <span>· {formatAge(item.ageMonths)}</span>}
              {item.vaccinated && (
                <span className="inline-flex items-center gap-0.5 text-emerald-700">
                  · <Syringe className="h-3 w-3" aria-hidden /> Vaccinated
                </span>
              )}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 pt-0.5 text-xs text-muted">
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" aria-hidden />
              <span className="truncate">{[item.area, item.district].filter(Boolean).join(", ") || "Bangladesh"}</span>
            </span>
            <span className="shrink-0">{timeAgo(item.createdAt)}</span>
          </div>
          {item.sellerVerified && (
            <p className="inline-flex items-center gap-1 text-xs font-medium text-sky-700">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              Verified {item.sellerType === "business" ? "shop" : item.sellerType === "shelter" ? "shelter" : "seller"}
            </p>
          )}
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <WishlistButton listingId={item.id} initial={wished ?? false} />
      </div>
    </article>
  );
}

export function ListingGrid({ items, wished }: { items: Card[]; wished?: Set<string> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <ListingCard key={item.id} item={item} wished={wished?.has(item.id)} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
          <div className="aspect-[4/3] bg-stone-100" />
          <div className="space-y-2 p-3">
            <div className="h-4 w-3/4 rounded bg-stone-100" />
            <div className="h-5 w-1/3 rounded bg-stone-100" />
            <div className="h-3 w-1/2 rounded bg-stone-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
