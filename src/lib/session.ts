import "server-only";
import { cache } from "react";
import { redirect, unstable_rethrow } from "next/navigation";
import { db } from "@/db";
import { auth } from "./auth";

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof loadUser>>>;

async function loadUser(id: string) {
  const user = await db.user.findUnique({
    where: { id },
    include: { roles: true, sellerProfile: true },
    omit: { passwordHash: true },
  });
  if (!user) return null;
  const roles = user.roles.map((r) => r.role);
  const sp = user.sellerProfile;
  return {
    ...user,
    roleList: roles,
    isAdmin: roles.includes("admin"),
    isBusiness: roles.includes("business") && sp?.type === "business" && sp.verificationStatus === "approved",
    isShelter: roles.includes("shelter") && sp?.type === "shelter" && sp.verificationStatus === "approved",
    isVerifiedSeller: sp?.verificationStatus === "approved",
  };
}

/** Current signed-in user (fresh from DB, so bans and role changes apply immediately). */
export const getCurrentUser = cache(async () => {
  try {
    const session = await auth();
    const id = session?.user?.id;
    if (!id) return null;
    const user = await loadUser(id);
    if (!user || user.status === "banned") return null;
    return user;
  } catch (err) {
    unstable_rethrow(err); // let Next.js handle its own control-flow errors
    console.error("[session] failed to load user", err);
    return null;
  }
});

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/admin");
  if (!user.isAdmin) redirect("/");
  return user;
}
