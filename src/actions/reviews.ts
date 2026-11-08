"use server";

import { revalidatePath } from "next/cache";
import { db, isUniqueViolation } from "@/db";
import { requireUser } from "@/lib/session";
import { reviewSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/utils";

/** Reviews are only allowed after a delivered order or a completed adoption. */
export async function createReviewAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/account");
  const parsed = reviewSchema.safeParse({
    orderId: formData.get("orderId") || undefined,
    adoptionRequestId: formData.get("adoptionRequestId") || undefined,
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { orderId, adoptionRequestId, rating, comment } = parsed.data;

  let sellerId: string | null = null;
  if (orderId) {
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyerId !== user.id || order.status !== "delivered") return { error: "You can review after the order is delivered." };
    sellerId = order.sellerId;
  } else if (adoptionRequestId) {
    const req = await db.adoptionRequest.findUnique({
      where: { id: adoptionRequestId },
      include: { listing: { select: { sellerId: true } } },
    });
    if (!req || req.requesterId !== user.id || req.status !== "completed") return { error: "You can review after the adoption is complete." };
    sellerId = req.listing.sellerId;
  }
  if (!sellerId) return { error: "Nothing to review." };

  try {
    await db.review.create({
      data: { orderId: orderId ?? null, adoptionRequestId: adoptionRequestId ?? null, reviewerId: user.id, sellerId, rating, comment },
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "You've already reviewed this." };
    throw err;
  }

  revalidatePath("/account");
  return { ok: true, message: "Thanks for your review!" };
}
