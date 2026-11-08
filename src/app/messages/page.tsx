import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Cat, MessageCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getInbox } from "@/lib/inbox";
import { EmptyState, PageHeader, buttonClass } from "@/components/ui";
import { cldTransform } from "@/lib/cloudinary";
import { cn, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function MessagesPage() {
  const user = await requireUser("/messages");
  const inbox = await getInbox(user.id);

  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader title="Messages" description="Conversations about your listings and the ones you're interested in." />
      {inbox.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="h-10 w-10" />}
          title="No conversations yet"
          description="Open a listing and tap “Chat with seller” to start one."
          action={<Link href="/cats" className={buttonClass()}>Browse cats</Link>}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line bg-white">
          {inbox.map((c) => {
            const other = c.buyerId === user.id ? c.sellerName : c.buyerName;
            return (
              <li key={c.id}>
                <Link href={`/messages/${c.id}`} className="flex items-center gap-3 p-4 hover:bg-brand-50/50">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                    {c.cover ? (
                      <Image src={cldTransform(c.cover, "f_auto,q_auto,c_fill,w_112,h_112")} alt="" fill sizes="56px" className="object-cover" />
                    ) : (
                      <Cat className="m-auto mt-4 h-6 w-6 text-brand-300" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate", c.unread > 0 ? "font-bold" : "font-semibold")}>{other}</span>
                      <span className="shrink-0 text-xs text-muted">{timeAgo(c.lastMessageAt)}</span>
                    </span>
                    <span className="block truncate text-xs text-brand-700">{c.listingTitle ?? "Listing removed"}</span>
                    <span className={cn("block truncate text-sm", c.unread > 0 ? "text-ink" : "text-muted")}>
                      {c.lastBody ?? "No messages yet"}
                    </span>
                  </span>
                  {c.unread > 0 && (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-brand-500 px-1.5 text-xs font-bold text-white">
                      {c.unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
