import "server-only";
import { db } from "@/db";

export async function getUnreadCount(userId: string) {
  return db.message.count({
    where: {
      senderId: { not: userId },
      readAt: null,
      conversation: { OR: [{ buyerId: userId }, { sellerId: userId }] },
    },
  });
}

/** Returns the conversation if the user participates in it. */
export async function getConversationFor(userId: string, conversationId: string) {
  const convo = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          slug: true,
          price: true,
          type: true,
          status: true,
          images: { take: 1, orderBy: [{ isCover: "desc" }, { position: "asc" }], select: { url: true } },
        },
      },
      buyer: { select: { id: true, name: true, username: true, avatar: true } },
      seller: { select: { id: true, name: true, username: true, avatar: true } },
    },
  });
  if (!convo || (convo.buyerId !== userId && convo.sellerId !== userId)) return null;
  return convo;
}
