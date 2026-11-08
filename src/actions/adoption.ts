"use server";

import { revalidatePath } from "next/cache";
import { db, isUniqueViolation, type Prisma } from "@/db";
import { requireUser } from "@/lib/session";
import { adoptionRequestSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/notify";
import { appUrl, type ActionState } from "@/lib/utils";

export async function createAdoptionRequestAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = adoptionRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { listingId, message, ...homeInfo } = parsed.data;

  const listing = await db.listing.findUnique({ where: { id: listingId } });
  if (!listing || listing.type !== "adoption" || listing.status !== "active") {
    return { error: "This cat is no longer available for adoption." };
  }
  if (listing.sellerId === user.id) return { error: "You can't adopt your own cat." };

  try {
    await db.adoptionRequest.create({
      data: { listingId, requesterId: user.id, message, homeInfo: homeInfo as Prisma.InputJsonObject },
    });
  } catch (err) {
    if (isUniqueViolation(err)) return { error: "You've already sent a request for this cat." };
    throw err;
  }

  const owner = await db.user.findUnique({ where: { id: listing.sellerId }, select: { email: true, name: true } });
  if (owner) {
    await sendEmail(
      owner.email,
      `New adoption request for "${listing.title}"`,
      `<p>Hi ${owner.name},</p><p>${user.name} would like to adopt <b>${listing.title}</b>.</p><p><a href="${appUrl("/dashboard/orders")}">Review the request</a></p>`,
    );
  }

  revalidatePath(`/listing/${listing.slug}`);
  return { ok: true, message: "Request sent! The owner will review it and get back to you." };
}

export async function updateAdoptionRequestAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const decision = String(formData.get("decision"));
  const note = String(formData.get("note") ?? "").slice(0, 500) || null;

  const req = await db.adoptionRequest.findUnique({
    where: { id },
    include: { listing: true, requester: { select: { email: true, name: true } } },
  });
  if (!req || req.listing.sellerId !== user.id) throw new Error("Not allowed");

  if (decision === "approve" && req.status === "pending") {
    await db.adoptionRequest.update({ where: { id }, data: { status: "approved", ownerNote: note } });
    await sendEmail(
      req.requester.email,
      "Your adoption request was approved 🎉",
      `<p>Good news! Your request for <b>${req.listing.title}</b> was approved. Open your chat on Meow to arrange the meet-up.</p><p><a href="${appUrl(`/listing/${req.listing.slug}`)}">View listing</a></p>`,
    );
  } else if (decision === "reject" && req.status === "pending") {
    await db.adoptionRequest.update({ where: { id }, data: { status: "rejected", ownerNote: note } });
  } else if (decision === "complete" && req.status === "approved") {
    await db.$transaction([
      db.adoptionRequest.update({ where: { id }, data: { status: "completed" } }),
      db.listing.update({ where: { id: req.listingId }, data: { status: "adopted" } }),
      // Close all other open requests for this cat.
      db.adoptionRequest.updateMany({
        where: { listingId: req.listingId, id: { not: id }, status: "pending" },
        data: { status: "cancelled" },
      }),
    ]);
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/listing/${req.listing.slug}`);
}
