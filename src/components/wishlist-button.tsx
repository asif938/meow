"use client";

import { Heart } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleWishlistAction } from "@/actions/wishlist";
import { cn } from "@/lib/utils";

export function WishlistButton({ listingId, initial, large }: { listingId: string; initial: boolean; large?: boolean }) {
  const [saved, setSaved] = useOptimistic(initial);
  const [, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
      onClick={() =>
        startTransition(async () => {
          setSaved(!saved);
          const res = await toggleWishlistAction(listingId);
          if (res?.needsLogin) router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
        })
      }
      className={cn(
        "grid cursor-pointer place-items-center rounded-full bg-white/90 text-ink shadow-sm backdrop-blur transition hover:scale-110",
        large ? "h-11 w-11 border border-line" : "h-8 w-8",
      )}
    >
      <Heart className={cn(large ? "h-5 w-5" : "h-4 w-4", saved && "fill-brand-500 text-brand-500")} />
    </button>
  );
}
