import "server-only";
import { db } from "@/db";
import type { Role } from "@/db/types";
import { randomSuffix, slugify } from "./utils";

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function uniqueUsername(base: string) {
  const root = slugify(base).replace(/-/g, "").slice(0, 20) || "meow";
  for (let i = 0; i < 5; i++) {
    const candidate = i === 0 ? root : `${root}${randomSuffix(4)}`;
    const taken = await db.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root}${Date.now().toString(36)}`;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash?: string | null;
  avatar?: string | null;
  isEmailVerified?: boolean;
}) {
  const username = await uniqueUsername(input.name || input.email.split("@")[0]);
  const user = await db.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      username,
      passwordHash: input.passwordHash ?? null,
      avatar: input.avatar ?? null,
      isEmailVerified: input.isEmailVerified ?? false,
    },
  });

  const roles: Role[] = ["buyer"];
  if (adminEmails().includes(user.email)) roles.push("admin");
  await db.userRole.createMany({ data: roles.map((role) => ({ userId: user.id, role })), skipDuplicates: true });
  return user;
}

export async function countUsers() {
  return db.user.count();
}
