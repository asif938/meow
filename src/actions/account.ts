"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { isAllowedImageUrl } from "@/lib/images";
import { passwordChangeSchema, profileSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/utils";

export async function updateProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/profile");
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, bio, shopName } = parsed.data;

  await db.user.update({ where: { id: user.id }, data: { name } });
  if (user.sellerProfile) {
    await db.sellerProfile.update({
      where: { userId: user.id },
      data: { bio: bio || null, ...(shopName ? { shopName } : {}) },
    });
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "Profile updated." };
}

export async function changePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser("/dashboard/profile");
  const parsed = passwordChangeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  // Accounts created with Google have no password yet, so they can set one without a current password.
  if (row?.passwordHash) {
    const current = parsed.data.currentPassword ?? "";
    if (!current || !(await bcrypt.compare(current, row.passwordHash))) return { error: "Your current password is incorrect." };
    if (await bcrypt.compare(parsed.data.newPassword, row.passwordHash)) return { error: "Choose a password different from your current one." };
  }
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10) } });
  return { ok: true, message: "Password updated." };
}

/** Avatar is uploaded straight to Cloudinary by the browser; we only store the resulting URL. */
export async function updateAvatarAction(avatar: string | null): Promise<ActionState> {
  const user = await requireUser("/dashboard/profile");
  if (avatar !== null && !isAllowedImageUrl(avatar)) return { error: "That image could not be used. Please upload it again." };
  await db.user.update({ where: { id: user.id }, data: { avatar } });
  revalidatePath("/", "layout");
  return { ok: true, message: avatar ? "Profile photo updated." : "Profile photo removed." };
}
