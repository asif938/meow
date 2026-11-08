"use server";

import { revalidatePath } from "next/cache";
import { db, type Prisma } from "@/db";
import type { Listing } from "@/db/types";
import { requireUser, type CurrentUser } from "@/lib/session";
import { listingSchema, type ListingInput } from "@/lib/validation";
import { findBannedWords } from "@/lib/moderation";
import { RULES } from "@/lib/constants";
import { isAllowedImageUrl } from "@/lib/images";
import { randomSuffix, slugify } from "@/lib/utils";

type SaveResult = { ok: true; slug: string; status: string; note?: string } | { ok: false; error: string; field?: string };

/** Permission + business rules that zod alone can't express. */
async function checkRules(user: CurrentUser, input: ListingInput, editingId?: string): Promise<string | null> {
  if (!user.isPhoneVerified && !user.isAdmin) return "Verify your phone number before posting (Account → Verify phone).";

  const category = await db.category.findUnique({ where: { id: input.categoryId } });
  if (!category || !category.isActive) return "Choose a valid category.";
  if (category.listingType !== input.type) return "That category doesn't match the listing type.";
  if (category.businessOnly && !user.isBusiness) {
    return `Only verified business sellers can list in ${category.name}.`;
  }

  if (input.type === "cat" && !user.isVerifiedSeller) {
    return "Selling cats requires ID verification. Upload your NID from Dashboard → Verification.";
  }

  if (input.type === "supply") {
    if (input.condition === "new" && !user.isBusiness) {
      return "Only approved business sellers can list new products. Individuals can list used items.";
    }
    if (category.allowedConditions.length && !category.allowedConditions.includes(input.condition)) {
      return `${category.name} can only be listed as: ${category.allowedConditions.join(", ")}.`;
    }
    if (category.requiresExpiry) {
      if (!input.expiryDate) return "Expiry date is required for this category.";
      if (new Date(input.expiryDate) <= new Date()) return "Expired items cannot be listed.";
      if (input.condition === "used" && !input.isSealed) return "Used food/litter must be sealed and unopened.";
    }
  }

  const location = await db.location.findUnique({ where: { id: input.locationId }, select: { id: true } });
  if (!location) return "Choose a valid location.";

  if (input.images.some((img) => !isAllowedImageUrl(img.url))) return "One of the photos is from an unsupported host.";

  if (!input.asDraft) {
    const minPhotos = input.type === "supply" ? RULES.minSupplyPhotos : RULES.minCatPhotos;
    if (input.images.length < minPhotos) return `Add at least ${minPhotos} photo${minPhotos > 1 ? "s" : ""}.`;
  }

  if (input.type === "cat" || input.type === "adoption") {
    const n = await db.listing.count({
      where: {
        sellerId: user.id,
        type: input.type,
        status: { in: ["active", "pending"] },
        ...(editingId ? { id: { not: editingId } } : {}),
      },
    });
    if (n >= RULES.maxActiveCatListingsPerSeller && !user.isShelter && !user.isAdmin) {
      return `You can have at most ${RULES.maxActiveCatListingsPerSeller} active cat listings. Mark some as sold/adopted first.`;
    }
  }

  return null;
}

/** Automated checks deciding whether a listing can go live immediately. */
async function autoReview(user: CurrentUser, input: ListingInput, listingId?: string): Promise<{ status: "active" | "pending"; note?: string }> {
  const extra = input.type === "supply" ? [input.brand, input.conditionNote] : [input.healthNote, input.breed];
  const banned = findBannedWords(input.title, input.description, ...extra);
  if (banned.length) return { status: "pending", note: `Flagged keywords: ${banned.join(", ")}` };

  const hashes = input.images.map((i) => i.hash).filter((h): h is string => Boolean(h));
  if (hashes.length) {
    const dupe = await db.listingImage.findFirst({
      where: {
        hash: { in: hashes },
        listing: { sellerId: { not: user.id }, ...(listingId ? { id: { not: listingId } } : {}) },
      },
      select: { id: true },
    });
    if (dupe) return { status: "pending", note: "Photo already used in another seller's listing" };
  }

  // Live animal sales always get a human look (animal-welfare rule).
  if (input.type === "cat" && !user.isAdmin) return { status: "pending", note: "Cat sale — manual welfare review" };

  return { status: "active" };
}

function toRows(input: ListingInput) {
  const base = {
    categoryId: input.categoryId,
    type: input.type,
    title: input.title,
    description: input.description,
    locationId: input.locationId,
    videoUrl: input.videoUrl ?? null,
  };
  if (input.type === "supply") {
    return {
      listing: {
        ...base,
        condition: input.condition,
        price: input.price,
        isNegotiable: input.isNegotiable,
        stock: input.condition === "new" ? input.stock : 1,
        attributes: {
          brand: input.brand || undefined,
          expiryDate: input.expiryDate || undefined,
          conditionNote: input.conditionNote || undefined,
          isSealed: input.isSealed || undefined,
        } as Prisma.InputJsonObject,
      },
      cat: null,
    };
  }
  const cat = {
    breed: input.breed,
    ageMonths: input.ageMonths,
    gender: input.gender,
    color: input.color || null,
    vaccinated: input.vaccinated,
    vaccineNote: input.vaccineNote || null,
    neutered: input.neutered,
    healthNote: input.healthNote,
    adoptionFee: input.type === "adoption" ? input.adoptionFee : 0,
  };
  return {
    listing: {
      ...base,
      condition: null,
      // Adoption listings never carry a sale price.
      price: input.type === "cat" ? input.price : 0,
      isNegotiable: input.type === "cat" ? input.isNegotiable : false,
      stock: 1,
      attributes: { breed: input.breed, ageMonths: input.ageMonths, gender: input.gender, vaccinated: input.vaccinated } as Prisma.InputJsonObject,
    },
    cat,
  };
}

async function saveImages(listingId: string, images: ListingInput["images"]) {
  await db.$transaction([
    db.listingImage.deleteMany({ where: { listingId } }),
    db.listingImage.createMany({
      data: images.map((img, i) => ({
        listingId,
        url: img.url,
        publicId: img.publicId ?? null,
        hash: img.hash ?? null,
        position: i,
        isCover: i === 0,
      })),
    }),
  ]);
}

export async function saveListingAction(raw: unknown, listingId?: string): Promise<SaveResult> {
  const user = await requireUser("/sell/new");

  const parsed = listingSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { ok: false, error: issue.message, field: String(issue.path[0] ?? "") };
  }
  const input = parsed.data;

  let existing: Listing | null = null;
  if (listingId) {
    existing = await db.listing.findUnique({ where: { id: listingId } });
    if (!existing || existing.sellerId !== user.id) return { ok: false, error: "Listing not found." };
    if (existing.type !== input.type) return { ok: false, error: "Listing type can't be changed." };
    if (["sold", "adopted"].includes(existing.status)) return { ok: false, error: "Closed listings can't be edited." };
  } else {
    const n = await db.listing.count({
      where: { sellerId: user.id, createdAt: { gt: new Date(Date.now() - 3_600_000) } },
    });
    if (n >= RULES.listingsPerHour && !user.isAdmin) {
      return { ok: false, error: "You're posting too quickly. Please wait a bit and try again." };
    }
  }

  const ruleError = await checkRules(user, input, listingId);
  if (ruleError) return { ok: false, error: ruleError };

  const review = input.asDraft ? { status: "draft" as const, note: undefined } : await autoReview(user, input, listingId);
  const { listing: row, cat } = toRows(input);

  let id: string;
  let slug: string;
  if (existing) {
    id = existing.id;
    slug = existing.slug;
    await db.listing.update({
      where: { id },
      data: {
        ...row,
        status: review.status,
        rejectionReason: null,
        publishedAt: review.status === "active" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      },
    });
  } else {
    const loc = await db.location.findUnique({ where: { id: input.locationId } });
    slug = `${slugify(`${input.title} ${loc?.district ?? ""}`)}-${randomSuffix(5)}`;
    const created = await db.listing.create({
      data: {
        ...row,
        sellerId: user.id,
        slug,
        status: review.status,
        publishedAt: review.status === "active" ? new Date() : null,
      },
      select: { id: true },
    });
    id = created.id;
  }

  if (cat) {
    await db.catDetails.upsert({
      where: { listingId: id },
      create: { listingId: id, ...cat },
      update: cat,
    });
  }
  await saveImages(id, input.images);

  revalidatePath("/dashboard");
  revalidatePath(`/listing/${slug}`);
  return { ok: true, slug, status: review.status, note: review.note };
}

export async function setListingStatusAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id"));
  const action = String(formData.get("action"));

  const listing = await db.listing.findUnique({ where: { id } });
  if (!listing || listing.sellerId !== user.id) throw new Error("Not allowed");

  if (action === "delete") {
    await db.listing.delete({ where: { id } });
  } else if (action === "sold" && listing.status === "active") {
    await db.listing.update({ where: { id }, data: { status: listing.type === "adoption" ? "adopted" : "sold" } });
  } else if (action === "relist" && (listing.status === "sold" || listing.status === "adopted")) {
    await db.listing.update({ where: { id }, data: { status: "pending" } });
  } else if (action === "unpublish" && listing.status === "active") {
    await db.listing.update({ where: { id }, data: { status: "draft" } });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/listing/${listing.slug}`);
}
