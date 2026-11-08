import "server-only";
import { Prisma, db } from "@/db";

export type InboxRow = {
  id: string;
  lastMessageAt: Date;
  listingTitle: string | null;
  listingSlug: string | null;
  buyerId: string;
  buyerName: string;
  sellerName: string;
  cover: string | null;
  lastBody: string | null;
  unread: number;
};

export async function getInbox(userId: string) {
  return db.$queryRaw<InboxRow[]>(Prisma.sql`
    select
      c.id,
      c.last_message_at as "lastMessageAt",
      l.title as "listingTitle",
      l.slug as "listingSlug",
      c.buyer_id as "buyerId",
      b.name as "buyerName",
      s.name as "sellerName",
      (select url from listing_images li where li.listing_id = l.id order by li.is_cover desc, li.position limit 1) as cover,
      (select body from messages m where m.conversation_id = c.id order by m.created_at desc limit 1) as "lastBody",
      (select count(*)::int from messages m where m.conversation_id = c.id and m.sender_id <> ${userId}::uuid and m.read_at is null) as unread
    from conversations c
    left join listings l on l.id = c.listing_id
    inner join users b on b.id = c.buyer_id
    inner join users s on s.id = c.seller_id
    where c.buyer_id = ${userId}::uuid or c.seller_id = ${userId}::uuid
    order by c.last_message_at desc
    limit 100
  `);
}
