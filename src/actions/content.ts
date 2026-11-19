"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { getCurrentUser, requireAdmin } from "@/lib/session";
import { blogPostSchema, contactSchema, newsletterSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { slugify, randomSuffix } from "@/lib/utils";
import type { ActionState } from "@/lib/utils";

/* -------------------------------- Contact form -------------------------------- */

export async function submitContactAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const user = await getCurrentUser();

  // Light abuse guard: max 5 messages per address per hour.
  const recent = await db.contactMessage.count({
    where: { email: parsed.data.email, createdAt: { gt: new Date(Date.now() - 3_600_000) } },
  });
  if (recent >= 5) return { error: "You have sent several messages recently. Please wait a while before sending another." };

  await db.contactMessage.create({ data: { ...parsed.data, userId: user?.id ?? null } });
  revalidatePath("/admin/messages");
  return { ok: true, message: "Thanks! Your message is on its way. We usually reply within one business day." };
}

export async function setContactStatusAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!["new", "read", "resolved"].includes(status)) return;
  await db.contactMessage.update({ where: { id }, data: { status: status as "new" | "read" | "resolved" } });
  await audit(admin.id, "contact.status", "contact_message", id, { status });
  revalidatePath("/admin/messages");
}

export async function deleteContactMessageAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.contactMessage.delete({ where: { id } }).catch(() => null);
  await audit(admin.id, "contact.delete", "contact_message", id);
  revalidatePath("/admin/messages");
}

/* -------------------------------- Newsletter -------------------------------- */

export async function subscribeNewsletterAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = newsletterSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  await db.newsletterSubscriber.upsert({ where: { email: parsed.data.email }, create: { email: parsed.data.email }, update: {} });
  return { ok: true, message: "You're subscribed. Welcome to the Meow community!" };
}

/* ---------------------------------- Blog (admin) ---------------------------------- */

function readPost(formData: FormData) {
  return blogPostSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    category: formData.get("category"),
    coverUrl: formData.get("coverUrl") ?? "",
    isPublished: formData.get("isPublished") === "on",
  });
}

const readMinutes = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 200));

export async function createPostAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = readPost(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const post = await db.blogPost.create({
    data: {
      title: d.title,
      excerpt: d.excerpt,
      content: d.content,
      category: d.category,
      coverUrl: d.coverUrl || null,
      isPublished: d.isPublished,
      publishedAt: d.isPublished ? new Date() : null,
      readMinutes: readMinutes(d.content),
      slug: `${slugify(d.title)}-${randomSuffix()}`,
      authorId: admin.id,
    },
  });
  await audit(admin.id, "blog.create", "blog_post", post.id);
  revalidatePath("/blog");
  redirect("/admin/blog");
}

export async function updatePostAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const parsed = readPost(formData);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const existing = await db.blogPost.findUnique({ where: { id }, select: { publishedAt: true, slug: true } });
  if (!existing) return { error: "Post not found." };
  await db.blogPost.update({
    where: { id },
    data: {
      title: d.title,
      excerpt: d.excerpt,
      content: d.content,
      category: d.category,
      coverUrl: d.coverUrl || null,
      isPublished: d.isPublished,
      publishedAt: d.isPublished ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      readMinutes: readMinutes(d.content),
    },
  });
  await audit(admin.id, "blog.update", "blog_post", id);
  revalidatePath("/blog");
  revalidatePath(`/blog/${existing.slug}`);
  return { ok: true, message: "Post saved." };
}

export async function deletePostAction(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  await db.blogPost.delete({ where: { id } }).catch(() => null);
  await audit(admin.id, "blog.delete", "blog_post", id);
  revalidatePath("/blog");
  revalidatePath("/admin/blog");
}
