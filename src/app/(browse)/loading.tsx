import { ListingGridSkeleton } from "@/components/listing-card";

export default function Loading() {
  return (
    <div className="container-page py-8">
      <div className="mb-6 h-8 w-56 animate-pulse rounded-lg bg-stone-100" />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-[var(--radius-card)] bg-stone-100 lg:block" />
        <ListingGridSkeleton />
      </div>
    </div>
  );
}
