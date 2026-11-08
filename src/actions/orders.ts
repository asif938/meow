"use server";

import { revalidatePath } from "next/cache";
import { db, type Prisma } from "@/db";
import type { OrderStatus } from "@/db/types";
import { requireUser } from "@/lib/session";
import { orderSchema } from "@/lib/validation";
import { normalizeBdPhone } from "@/lib/moderation";
import type { ActionState } from "@/lib/utils";

const TRANSITIONS: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

export async function createOrderAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = orderSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { listingId, quantity, ...address } = parsed.data;

  const phone = normalizeBdPhone(address.phone);
  if (!phone) return { error: "Enter a valid Bangladeshi phone number." };

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.type !== "supply" || listing.status !== "active") return { error: "This item is no longer available." };
  if (listing.sellerId === user.id) return { error: "You can't order your own item." };

  const seller = await db.sellerProfile.findUnique({ where: { userId: listing.sellerId } });
  if (seller?.type !== "business" || seller.verificationStatus !== "approved") {
    return { error: "Online ordering is only available from verified shops. Please chat with the seller." };
  }

  // Reserve stock and create the order in one transaction, so a failure can't leave stock
  // decremented without an order. The conditional update is atomic, so two buyers can't oversell.
  const placed = await db.$transaction(async (tx) => {
    const reserved = await tx.listing.updateMany({
      where: { id: listingId, stock: { gte: quantity }, status: "active" },
      data: { stock: { decrement: quantity } },
    });
    if (reserved.count === 0) return false;

    await tx.order.create({
      data: {
        buyerId: user.id,
        sellerId: listing.sellerId,
        address: { ...address, phone } as Prisma.InputJsonObject,
        paymentMethod: "cod",
        total: listing.price * quantity,
        items: { create: { listingId, title: listing.title, price: listing.price, quantity } },
      },
    });

    // We hold the row lock from the update above, so this read is exact.
    const left = await tx.listing.findUnique({ where: { id: listingId }, select: { stock: true } });
    if (left?.stock === 0) await tx.listing.update({ where: { id: listingId }, data: { status: "sold" } });
    return true;
  });
  if (!placed) return { error: "Not enough stock left." };

  revalidatePath(`/listing/${listing.slug}`);
  return { ok: true, message: "Order placed! The shop will confirm it soon. Track it under My account → Orders." };
}

export async function updateOrderStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const next = String(formData.get("status"));

  const order = await db.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw new Error("Order not found");

  const isSeller = order.sellerId === user.id;
  const isBuyer = order.buyerId === user.id;
  // Buyers may only cancel while still pending.
  const allowed = isSeller
    ? TRANSITIONS[order.status]
    : isBuyer && order.status === "pending"
      ? ["cancelled"]
      : [];
  if (!allowed.includes(next)) throw new Error("Invalid status change");

  await db.$transaction(async (tx) => {
    await tx.order.update({ where: { id }, data: { status: next as OrderStatus } });

    if (next === "cancelled") {
      // Give the stock back, and re-open listings that sold out because of this order.
      for (const item of order.items) {
        if (!item.listingId) continue;
        await tx.listing.update({ where: { id: item.listingId }, data: { stock: { increment: item.quantity } } });
        await tx.listing.updateMany({ where: { id: item.listingId, status: "sold" }, data: { status: "active" } });
      }
    }
  });

  revalidatePath("/dashboard/orders");
  revalidatePath("/account");
}
