"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { sellerVerificationSchema } from "@/lib/validation";
import { randomSuffix, slugify, type ActionState } from "@/lib/utils";
import { isAllowedImageUrl } from "@/lib/images";

export async function submitVerificationAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/shop");
  const parsed = sellerVerificationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { type, shopName, bio, documentUrl } = parsed.data;

  if (!isAllowedImageUrl(documentUrl)) return { error: "Please upload the document using the uploader." };
  if (!user.isPhoneVerified) return { error: "Verify your phone number first." };
  if ((type === "business" || type === "shelter") && !shopName) {
    return { error: type === "business" ? "Shop name is required." : "Organisation name is required." };
  }
  if (user.sellerProfile?.verificationStatus === "pending") return { error: "Your previous application is still under review." };

  const existing = user.sellerProfile;
  const slug = existing?.slug ?? (shopName ? `${slugify(shopName)}-${randomSuffix(4)}` : null);
  const docs = {
    nidUrl: type === "individual" ? documentUrl : (existing?.nidUrl ?? null),
    tradeLicenseUrl: type === "business" ? documentUrl : (existing?.tradeLicenseUrl ?? null),
    orgProofUrl: type === "shelter" ? documentUrl : (existing?.orgProofUrl ?? null),
  };

  const values = {
    type,
    shopName: shopName || null,
    bio: bio || null,
    slug,
    ...docs,
    verificationStatus: "pending" as const,
    rejectionReason: null,
  };
  await db.sellerProfile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...values },
    update: values,
  });

  revalidatePath("/dashboard/shop");
  return { ok: true, message: "Submitted! Our team usually reviews applications within 24 hours." };
}

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/account");
  const name = String(formData.get("name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim().slice(0, 1000);
  const shopName = String(formData.get("shopName") ?? "").trim().slice(0, 80);
  if (name.length < 2) return { error: "Name is too short." };

  await db.user.update({ where: { id: user.id }, data: { name } });
  if (user.sellerProfile) {
    await db.sellerProfile.update({
      where: { userId: user.id },
      data: { bio: bio || null, ...(shopName ? { shopName } : {}) },
    });
  }
  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}
