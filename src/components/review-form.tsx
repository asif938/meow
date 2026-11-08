"use client";

import { useActionState, useState } from "react";
import { Star } from "lucide-react";
import { createReviewAction } from "@/actions/reviews";
import { Input } from "@/components/ui";
import { FormMessage, SubmitButton } from "./submit-button";
import { cn } from "@/lib/utils";

export function ReviewForm({ orderId, adoptionRequestId }: { orderId?: string; adoptionRequestId?: string }) {
  const [state, action] = useActionState(createReviewAction, undefined);
  const [rating, setRating] = useState(0);

  if (state?.ok) return <FormMessage state={state} />;

  return (
    <form action={action} className="mt-3 space-y-2 rounded-xl bg-stone-50 p-3">
      {orderId && <input type="hidden" name="orderId" value={orderId} />}
      {adoptionRequestId && <input type="hidden" name="adoptionRequestId" value={adoptionRequestId} />}
      <input type="hidden" name="rating" value={rating} />
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className="cursor-pointer"
          >
            <Star className={cn("h-6 w-6", n <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300")} />
          </button>
        ))}
      </div>
      <Input name="comment" placeholder="How was your experience? (optional)" className="h-9" />
      <FormMessage state={state} />
      <SubmitButton size="sm" disabled={rating === 0}>Submit review</SubmitButton>
    </form>
  );
}
