import type { Metadata } from "next";
import Link from "next/link";
import { HeartHandshake, Package } from "lucide-react";
import { db } from "@/db";
import type { HomeInfo, OrderAddress } from "@/db/types";
import { requireUser } from "@/lib/session";
import { updateAdoptionRequestAction } from "@/actions/adoption";
import { updateOrderStatusAction } from "@/actions/orders";
import { formatBDT, timeAgo } from "@/lib/utils";
import { Badge, EmptyState, Input, buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Orders & requests", robots: { index: false } };

const NEXT_STEP: Record<string, { status: string; label: string }[]> = {
  pending: [
    { status: "confirmed", label: "Confirm" },
    { status: "cancelled", label: "Cancel" },
  ],
  confirmed: [
    { status: "shipped", label: "Mark shipped" },
    { status: "cancelled", label: "Cancel" },
  ],
  shipped: [{ status: "delivered", label: "Mark delivered" }],
};

export default async function SellerOrdersPage() {
  const user = await requireUser("/dashboard/orders");

  const [orderRows, requestRows] = await Promise.all([
    db.order.findMany({
      where: { sellerId: user.id },
      include: { items: true, buyer: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.adoptionRequest.findMany({
      where: { listing: { sellerId: user.id } },
      include: {
        listing: { select: { title: true, slug: true } },
        requester: { select: { name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  // JSON columns come back untyped; narrow them once here.
  const incoming = orderRows.map((o) => ({ ...o, address: o.address as OrderAddress }));
  const requests = requestRows.map((r) => ({
    id: r.id,
    status: r.status,
    message: r.message,
    homeInfo: r.homeInfo as HomeInfo,
    createdAt: r.createdAt,
    listingTitle: r.listing.title,
    listingSlug: r.listing.slug,
    requesterName: r.requester.name,
    requesterUsername: r.requester.username,
  }));

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <HeartHandshake className="h-5 w-5 text-teal-600" /> Adoption requests
        </h2>
        {requests.length === 0 ? (
          <EmptyState title="No adoption requests yet" description="When someone applies to adopt one of your cats, it shows up here." />
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      <Link href={`/seller/${r.requesterUsername}`} className="hover:underline">{r.requesterName}</Link>
                      <span className="font-normal text-muted"> wants to adopt </span>
                      <Link href={`/listing/${r.listingSlug}`} className="text-brand-700 hover:underline">{r.listingTitle}</Link>
                    </p>
                    <p className="text-xs text-muted">{timeAgo(r.createdAt)}</p>
                  </div>
                  <Badge tone={r.status === "approved" || r.status === "completed" ? "green" : r.status === "pending" ? "amber" : "gray"}>{r.status}</Badge>
                </div>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-muted">Home</dt><dd>{r.homeInfo.homeType}</dd></div>
                  <div><dt className="text-xs text-muted">Other pets</dt><dd>{r.homeInfo.otherPets || "None"}</dd></div>
                  <div><dt className="text-xs text-muted">Phone</dt><dd>{r.status === "approved" || r.status === "completed" ? r.homeInfo.phone || "—" : "Shown after approval"}</dd></div>
                  <div className="sm:col-span-3"><dt className="text-xs text-muted">Experience</dt><dd>{r.homeInfo.experience}</dd></div>
                  <div className="sm:col-span-3"><dt className="text-xs text-muted">Message</dt><dd className="whitespace-pre-line">{r.message}</dd></div>
                </dl>
                {r.status === "pending" && (
                  <form action={updateAdoptionRequestAction} className="mt-4 flex flex-col gap-2 sm:flex-row">
                    <input type="hidden" name="id" value={r.id} />
                    <Input name="note" placeholder="Optional note to the adopter" className="h-9 flex-1" />
                    <div className="flex gap-2">
                      <button name="decision" value="approve" className={buttonClass("teal", "sm")}>Approve</button>
                      <button name="decision" value="reject" className={buttonClass("outline", "sm")}>Reject</button>
                    </div>
                  </form>
                )}
                {r.status === "approved" && (
                  <form action={updateAdoptionRequestAction} className="mt-4">
                    <input type="hidden" name="id" value={r.id} />
                    <button name="decision" value="complete" className={buttonClass("primary", "sm")}>Mark adoption complete</button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
          <Package className="h-5 w-5 text-brand-600" /> Incoming orders (Cash on delivery)
        </h2>
        {incoming.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description={user.isBusiness ? "Orders for your new products will appear here." : "Online ordering is available to verified business sellers."}
          />
        ) : (
          <ul className="space-y-3">
            {incoming.map((o) => (
              <li key={o.id} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">Order #{o.id.slice(0, 8)} · {formatBDT(o.total)}</p>
                    <p className="text-xs text-muted">{o.buyer.name} · {timeAgo(o.createdAt)} · COD</p>
                  </div>
                  <Badge tone={o.status === "delivered" ? "green" : o.status === "cancelled" ? "red" : "amber"}>{o.status}</Badge>
                </div>
                <ul className="mt-2 text-sm">
                  {o.items.map((i) => (
                    <li key={i.id}>{i.quantity} × {i.title} — {formatBDT(i.price)}</li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-muted">
                  Deliver to: {o.address.name}, {o.address.phone}, {o.address.line}, {o.address.district}
                  {o.address.note && ` (${o.address.note})`}
                </p>
                {NEXT_STEP[o.status] && (
                  <form action={updateOrderStatusAction} className="mt-3 flex gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    {NEXT_STEP[o.status].map((s) => (
                      <button key={s.status} name="status" value={s.status} className={buttonClass(s.status === "cancelled" ? "outline" : "primary", "sm")}>
                        {s.label}
                      </button>
                    ))}
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
