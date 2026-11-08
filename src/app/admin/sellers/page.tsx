import Link from "next/link";
import { db } from "@/db";
import { reviewSellerAction } from "@/actions/admin";
import { timeAgo } from "@/lib/utils";
import { Badge, EmptyState, Input, buttonClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function AdminSellersPage({ searchParams }: Props) {
  const { status: raw } = await searchParams;
  const status = raw === "approved" || raw === "rejected" ? raw : "pending";

  const rows = await db.sellerProfile.findMany({
    where: { verificationStatus: status },
    include: { user: { select: { name: true, username: true, email: true, phone: true, isPhoneVerified: true, createdAt: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {["pending", "approved", "rejected"].map((s) => (
          <Link key={s} href={`/admin/sellers?status=${s}`} className={cn(buttonClass(s === status ? "primary" : "outline", "sm"), "capitalize")}>
            {s}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <EmptyState title={`No ${status} applications`} />
      ) : (
        <ul className="space-y-3">
          {rows.map((p) => {
            const doc = p.type === "business" ? p.tradeLicenseUrl : p.type === "shelter" ? p.orgProofUrl : p.nidUrl;
            return (
              <li key={p.userId} className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 md:flex-row">
                {doc && (
                  <a href={doc} target="_blank" rel="noreferrer" className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={doc} alt="Verification document" className="h-32 w-48 rounded-lg bg-stone-100 object-cover" />
                  </a>
                )}
                <div className="min-w-0 flex-1 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge tone="brand" className="capitalize">{p.type}</Badge>
                    <span className="text-xs text-muted">submitted {timeAgo(p.updatedAt)}</span>
                  </div>
                  <p className="font-semibold">
                    {p.shopName ?? p.user.name}{" "}
                    <Link href={`/seller/${p.user.username}`} className="font-normal text-muted underline">@{p.user.username}</Link>
                  </p>
                  <p className="text-muted">{p.user.email} · {p.user.phone ?? "no phone"} {p.user.isPhoneVerified && "✓"}</p>
                  <p className="text-muted">Member since {new Date(p.user.createdAt).toLocaleDateString("en-GB")}</p>
                  {p.bio && <p className="line-clamp-2">{p.bio}</p>}
                  {p.rejectionReason && <p className="text-xs text-red-600">Reason: {p.rejectionReason}</p>}
                </div>
                <form action={reviewSellerAction} className="flex shrink-0 flex-col gap-2 md:w-56">
                  <input type="hidden" name="userId" value={p.userId} />
                  {status !== "approved" && <button name="decision" value="approve" className={buttonClass("teal", "sm")}>Approve</button>}
                  {status !== "rejected" && (
                    <>
                      <Input name="reason" placeholder="Rejection reason" className="h-9" />
                      <button name="decision" value="reject" className={buttonClass("danger", "sm")}>Reject</button>
                    </>
                  )}
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
