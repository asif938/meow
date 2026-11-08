"use server";

import { redirect } from "next/navigation";
import { db, isUniqueViolation } from "@/db";
import { requireUser } from "@/lib/session";
import { getConversationFor } from "@/lib/chat";
import { containsContactInfo } from "@/lib/moderation";
import { RULES } from "@/lib/constants";

export async function startConversationAction(formData: FormData) {
  const listingId = String(formData.get("listingId"));
  const user = await requireUser();

  const listing = await db.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, slug: true },
  });
  if (!listing) redirect("/");
  if (listing.sellerId === user.id) redirect(`/listing/${listing.slug}`);

  const find = () =>
    db.conversation.findFirst({ where: { listingId: listing.id, buyerId: user.id }, select: { id: true } });

  const existing = await find();
  if (existing) redirect(`/messages/${existing.id}`);

  let id: string;
  try {
    id = (
      await db.conversation.create({
        data: { listingId: listing.id, buyerId: user.id, sellerId: listing.sellerId },
        select: { id: true },
      })
    ).id;
  } catch (err) {
    // Lost a race with another request creating the same conversation.
    if (!isUniqueViolation(err)) throw err;
    id = (await find())!.id;
  }
  redirect(`/messages/${id}`);
}

export type ChatMessage = {
  id: string;
  body: string;
  senderId: string;
  flagged: boolean;
  createdAt: string;
  readAt: string | null;
};

export async function sendMessageAction(conversationId: string, body: string): Promise<{ error?: string; message?: ChatMessage }> {
  const user = await requireUser();
  const text = body.trim().slice(0, 2000);
  if (!text) return { error: "Message is empty." };

  const convo = await getConversationFor(user.id, conversationId);
  if (!convo) return { error: "Conversation not found." };

  const n = await db.message.count({
    where: { senderId: user.id, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });
  if (n >= RULES.messagesPerMinute) return { error: "You're sending messages too fast. Slow down a little." };

  const msg = await db.message.create({
    data: { conversationId, senderId: user.id, body: text, flagged: containsContactInfo(text) },
  });
  await db.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } });

  return {
    message: {
      id: msg.id,
      body: msg.body,
      senderId: msg.senderId,
      flagged: msg.flagged,
      createdAt: msg.createdAt.toISOString(),
      readAt: null,
    },
  };
}

export async function markConversationReadAction(conversationId: string) {
  const user = await requireUser();
  const convo = await getConversationFor(user.id, conversationId);
  if (!convo) return;
  await db.message.updateMany({
    where: { conversationId, senderId: { not: user.id }, readAt: null },
    data: { readAt: new Date() },
  });
}
