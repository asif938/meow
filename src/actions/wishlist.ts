"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

export async function toggleWishlistAction(listingId: string) {
  const user = await getCurrentUser();
  if (!user) return { needsLogin: true };

  const where = { userId: user.id, listingId };
  const existing = await db.wishlist.findUnique({ where: { userId_listingId: where } });
  if (existing) await db.wishlist.delete({ where: { userId_listingId: where } });
  else await db.wishlist.createMany({ data: [where], skipDuplicates: true });

  revalidatePath("/account");
  return { saved: !existing };
}
