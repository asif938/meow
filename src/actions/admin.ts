"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import type { ListingType, Role } from "@/db/types";
import { requireAdmin } from "@/lib/session";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/notify";
import { slugify } from "@/lib/utils";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function moderateListingAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const decision = str(formData, "decision");
  const reason = str(formData, "reason") || null;

  const listing = await db.listing.findUnique({ where: { id }, include: { seller: { select: { email: true } } } });
  if (!listing) return;

  if (decision === "approve") {
    await db.listing.update({
      where: { id },
      data: { status: "active", rejectionReason: null, publishedAt: listing.publishedAt ?? new Date() },
    });
  } else if (decision === "reject") {
    await db.listing.update({ where: { id }, data: { status: "rejected", rejectionReason: reason ?? "Does not meet our guidelines" } });
    await sendEmail(listing.seller.email, "Your Meow listing needs changes", `<p>Your listing "<b>${listing.title}</b>" was not approved.</p><p>Reason: ${reason ?? "Does not meet our guidelines"}</p>`);
  } else if (decision === "feature" || decision === "unfeature") {
    await db.listing.update({ where: { id }, data: { isFeatured: decision === "feature" } });
  }

  await audit(admin.id, `listing.${decision}`, "listing", id, reason ? { reason } : undefined);
  revalidatePath("/admin");
  revalidatePath("/admin/listings");
  revalidatePath(`/listing/${listing.slug}`);
}

export async function reviewSellerAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = str(formData, "userId");
  const decision = str(formData, "decision");
  const reason = str(formData, "reason") || null;

  const profile = await db.sellerProfile.findUnique({ where: { userId }, include: { user: { select: { email: true } } } });
  if (!profile) return;

  if (decision === "approve") {
    await db.sellerProfile.update({
      where: { userId },
      data: { verificationStatus: "approved", rejectionReason: null, verifiedAt: new Date() },
    });
    const role: Role = profile.type === "business" ? "business" : profile.type === "shelter" ? "shelter" : "seller";
    await db.userRole.createMany({ data: [{ userId, role }], skipDuplicates: true });
    await sendEmail(profile.user.email, "You're verified on Meow ✅", "<p>Your seller verification was approved. The verified badge now shows on your profile and listings.</p>");
  } else if (decision === "reject") {
    await db.sellerProfile.update({
      where: { userId },
      data: { verificationStatus: "rejected", rejectionReason: reason ?? "Document unclear or invalid" },
    });
    await sendEmail(profile.user.email, "Meow verification update", `<p>Your verification was not approved. Reason: ${reason ?? "Document unclear or invalid"}. You can re-apply from your dashboard.</p>`);
  }

  await audit(admin.id, `seller.${decision}`, "user", userId, reason ? { reason } : undefined);
  revalidatePath("/admin/sellers");
  revalidatePath("/admin");
}

export async function resolveReportAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const decision = str(formData, "decision"); // resolved | dismissed
  const note = str(formData, "note") || null;
  const takedown = formData.get("takedown") === "1";

  const report = await db.report.findUnique({ where: { id } });
  if (!report) return;

  if (takedown && report.targetType === "listing") {
    await db.listing.updateMany({
      where: { id: report.targetId },
      data: { status: "rejected", rejectionReason: `Removed after report: ${report.reason}` },
    });
  }
  if (takedown && report.targetType === "user") {
    await db.user.updateMany({ where: { id: report.targetId }, data: { status: "banned", banReason: report.reason } });
  }
  await db.report.update({
    where: { id },
    data: { status: decision === "dismissed" ? "dismissed" : "resolved", resolutionNote: note },
  });

  await audit(admin.id, `report.${decision}${takedown ? "+takedown" : ""}`, "report", id, { target: report.targetId });
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

export async function setUserStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const userId = str(formData, "userId");
  const status = str(formData, "status") === "banned" ? "banned" : "active";
  const reason = str(formData, "reason") || null;
  if (userId === admin.id) return;

  await db.user.updateMany({ where: { id: userId }, data: { status, banReason: status === "banned" ? reason : null } });
  if (status === "banned") {
    // Hide their live listings.
    await db.listing.updateMany({
      where: { sellerId: userId },
      data: { status: "rejected", rejectionReason: "Seller account suspended" },
    });
  }
  await audit(admin.id, status === "banned" ? "user.ban" : "user.unban", "user", userId, reason ? { reason } : undefined);
  revalidatePath("/admin/users");
}

export async function saveCategoryAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (name.length < 2) return;
  const listingType = str(formData, "listingType") as ListingType;
  const conditions = formData.getAll("allowedConditions").map(String).filter((c): c is "new" | "used" => c === "new" || c === "used");
  const values = {
    name,
    nameBn: str(formData, "nameBn") || null,
    slug: str(formData, "slug") || slugify(name),
    parentId: str(formData, "parentId") || null,
    icon: str(formData, "icon") || null,
    listingType,
    allowedConditions: conditions,
    businessOnly: formData.get("businessOnly") === "on",
    requiresExpiry: formData.get("requiresExpiry") === "on",
    isActive: formData.get("isActive") === "on",
    position: Number(str(formData, "position")) || 0,
  };

  if (id) await db.category.update({ where: { id }, data: values });
  else await db.category.create({ data: values });

  await audit(admin.id, id ? "category.update" : "category.create", "category", id || null, { name });
  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
}
