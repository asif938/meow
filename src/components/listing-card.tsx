import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Cat, MapPin, Syringe } from "lucide-react";
import { Badge, Skeleton } from "@/components/ui";
import { cldTransform } from "@/lib/cloudinary";
import { cn, formatAge, formatBDT, timeAgo } from "@/lib/utils";
import type { ListingCard as Card } from "@/lib/queries";
import { WishlistButton } from "./wishlist-button";

/**
 * Every card has the same structure and height: image, title, 2-line description, price,
 * meta rows and a "View Details" button pinned to the bottom.
 */
export function ListingCard({ item, wished, priority }: { item: Card; wished?: boolean; priority?: boolean }) {
  const isAdoption = item.type === "adoption";
  const href = `/listing/${item.slug}`;
  const priceLabel = isAdoption
    ? item.adoptionFee
      ? `Rehoming fee ${formatBDT(item.adoptionFee)}`
      : "Free adoption"
    : formatBDT(item.price);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-surface transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-orange-900/5">
      <Link href={href} className="relative block aspect-[4/3] shrink-0 overflow-hidden bg-brand-50" tabIndex={-1} aria-hidden>
        {item.cover ? (
          <Image
            src={cldTransform(item.cover, "f_auto,q_auto,c_fill,w_600,h_450")}
            alt=""
            fill
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-brand-300">
            <Cat className="h-14 w-14" aria-hidden />
          </div>
        )}
      </Link>
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1">
        {isAdoption && <Badge tone="teal" className="bg-teal-600 text-white">Adoption</Badge>}
        {item.condition === "new" && <Badge tone="green" className="bg-emerald-600 text-white">New</Badge>}
        {item.condition === "used" && <Badge className="bg-surface/90">Used</Badge>}
        {item.status === "sold" && <Badge className="bg-night text-white">Sold</Badge>}
        {item.status === "adopted" && <Badge className="bg-night text-white">Adopted</Badge>}
      </div>
      <div className="absolute right-2 top-2">
        <WishlistButton listingId={item.id} initial={wished ?? false} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-1 text-base font-semibold leading-snug">
          <Link href={href} className="hover:text-brand-600">{item.title}</Link>
        </h3>
        <p className="line-clamp-2 min-h-10 text-sm text-muted">{item.description ?? "No description provided."}</p>
        <p className={isAdoption ? "text-sm font-semibold text-teal-700" : "font-display text-lg font-bold text-brand-600"}>
          {priceLabel}
          {item.isNegotiable && !isAdoption && <span className="ml-1.5 text-xs font-normal text-muted">Negotiable</span>}
        </p>
        <p className="flex min-h-4 flex-wrap items-center gap-x-2 text-xs text-muted">
          {item.breed ? (
            <>
              <span>{item.breed}</span>
              {item.ageMonths != null && <span>· {formatAge(item.ageMonths)}</span>}
              {item.vaccinated && (
                <span className="inline-flex items-center gap-0.5 text-emerald-700">
                  · <Syringe className="h-3 w-3" aria-hidden /> Vaccinated
                </span>
              )}
            </>
          ) : (
            <span className="capitalize">{item.condition ? `${item.condition} item` : "Cat supply"}</span>
          )}
        </p>
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{[item.area, item.district].filter(Boolean).join(", ") || "Bangladesh"}</span>
          </span>
          <span className="shrink-0">{timeAgo(item.createdAt)}</span>
        </div>
        <p className={cn("inline-flex min-h-4 items-center gap-1 text-xs font-medium text-sky-700", !item.sellerVerified && "invisible")}>
          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
          Verified {item.sellerType === "business" ? "shop" : item.sellerType === "shelter" ? "shelter" : "seller"}
        </p>
        <Link
          href={href}
          className="mt-auto inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line text-sm font-medium transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
        >
          View Details <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </article>
  );
}

const GRID = "grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4";

export function ListingGrid({ items, wished, className }: { items: Card[]; wished?: Set<string>; className?: string }) {
  return (
    <div className={cn(GRID, className)}>
      {items.map((item) => (
        <ListingCard key={item.id} item={item} wished={wished?.has(item.id)} />
      ))}
    </div>
  );
}

export function ListingGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn(GRID, className)} aria-busy aria-label="Loading listings">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-line bg-surface">
          <Skeleton className="aspect-[4/3] rounded-none" />
          <div className="space-y-2.5 p-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
