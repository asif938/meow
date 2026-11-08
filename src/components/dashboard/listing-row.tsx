"use client";

import { memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Cat, Eye } from "lucide-react";
import { setListingStatusAction } from "@/actions/listings";
import { useIsSelected, type SelectionStore } from "@/lib/hooks";
import type { ListingRowData } from "@/lib/dashboard-types";
import { Badge, buttonClass } from "@/components/ui";
import { ConfirmButton } from "@/components/confirm-button";

const STATUS_TONE = {
  draft: "gray",
  pending: "amber",
  active: "green",
  sold: "blue",
  adopted: "teal",
  rejected: "red",
} as const;

type Props = { row: ListingRowData; store: SelectionStore };

/**
 * Memoized: only re-renders when its own `row` object changes or ITS selected flag flips
 * (selection is read through a per-id external-store subscription, not through props).
 */
export const ListingRow = memo(function ListingRow({ row: r, store }: Props) {
  const selected = useIsSelected(store, r.id);
  const closed = r.status === "sold" || r.status === "adopted";
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border bg-white p-3 sm:flex-row sm:items-center ${selected ? "border-brand-400 ring-1 ring-brand-300" : "border-line"}`}
    >
      <input
        type="checkbox"
        checked={selected}
        onChange={() => store.toggle(r.id)}
        aria-label={`Select ${r.title}`}
        className="h-4 w-4 shrink-0 cursor-pointer accent-brand-500"
      />
      <Link href={`/listing/${r.slug}`} className="flex min-w-0 flex-1 items-center gap-3">
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-50 text-brand-300">
          {r.cover ? (
            <Image src={r.cover} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <Cat className="h-6 w-6" aria-hidden />
          )}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
            <span className="text-xs capitalize text-muted">
              {r.type}
              {r.condition ? ` · ${r.condition}` : ""}
            </span>
          </span>
          <span className="mt-1 block truncate font-semibold">{r.title}</span>
          <span className="flex flex-wrap gap-x-3 text-xs text-muted">
            {r.priceLabel && <span>{r.priceLabel}</span>}
            {r.condition === "new" && <span>Stock: {r.stock}</span>}
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {r.viewCount}
            </span>
            <span>{r.ageLabel}</span>
          </span>
          {r.status === "rejected" && r.rejectionReason && (
            <span className="mt-1 block truncate text-xs text-red-600">Reason: {r.rejectionReason}</span>
          )}
        </span>
      </Link>
      <div className="flex flex-wrap gap-2 sm:justify-end">
        {!closed && (
          <Link href={`/dashboard/listings/${r.id}/edit`} className={buttonClass("outline", "sm")}>
            Edit
          </Link>
        )}
        {r.status === "active" && (
          <form action={setListingStatusAction}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="action" value="sold" />
            <button className={buttonClass("secondary", "sm")}>Mark {r.type === "adoption" ? "adopted" : "sold"}</button>
          </form>
        )}
        {closed && (
          <form action={setListingStatusAction}>
            <input type="hidden" name="id" value={r.id} />
            <input type="hidden" name="action" value="relist" />
            <button className={buttonClass("outline", "sm")}>Relist</button>
          </form>
        )}
        <form action={setListingStatusAction}>
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="action" value="delete" />
          <ConfirmButton message="Delete this listing permanently?" className={buttonClass("ghost", "sm", "text-red-600")}>
            Delete
          </ConfirmButton>
        </form>
      </div>
    </div>
  );
});
