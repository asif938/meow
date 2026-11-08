import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { getConversationFor } from "@/lib/chat";
import { markConversationReadAction } from "@/actions/chat";
import { formatBDT } from "@/lib/utils";
import { ChatThread } from "./chat-thread";

export const metadata: Metadata = { title: "Chat", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function ThreadPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/messages/${id}`);
  const convo = await getConversationFor(user.id, id);
  if (!convo) notFound();

  const rows = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 500,
  });
  await markConversationReadAction(id);

  const other = convo.buyerId === user.id ? convo.seller : convo.buyer;

  return (
    <div className="container-page max-w-3xl py-4 sm:py-8">
      <div className="mb-3 flex items-center gap-3 rounded-2xl border border-line bg-white p-3">
        <Link href="/messages" className="grid h-9 w-9 place-items-center rounded-full hover:bg-brand-50" aria-label="Back to inbox">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link href={`/seller/${other.username}`} className="font-semibold hover:underline">{other.name}</Link>
          {convo.listing && (
            <Link href={`/listing/${convo.listing.slug}`} className="block truncate text-xs text-brand-700 hover:underline">
              {convo.listing.title}
              {convo.listing.type !== "adoption" && ` · ${formatBDT(convo.listing.price)}`}
            </Link>
          )}
        </div>
      </div>
      <ChatThread
        conversationId={id}
        meId={user.id}
        initial={rows.map((m) => ({
          id: m.id,
          body: m.body,
          senderId: m.senderId,
          flagged: m.flagged,
          createdAt: m.createdAt.toISOString(),
          readAt: m.readAt?.toISOString() ?? null,
        }))}
      />
    </div>
  );
}
