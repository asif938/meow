import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Cat, Plus } from "lucide-react";
import { db } from "@/db";
import type { Prisma } from "@/db";
import { requireUser } from "@/lib/session";
import { cldTransform } from "@/lib/cloudinary";
import { parseTableQuery, PAGE_SIZE_TABLE, type SearchParams } from "@/lib/table";
import { formatBDT, timeAgo } from "@/lib/utils";
import { deleteMyListingAction, setListingStatusAction } from "@/actions/listings";
import { Alert, Badge, EmptyState, PageHeader, Table, TBody, TD, THead, TR, TH, buttonClass } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { TableToolbar } from "@/components/data-table/toolbar";
import { SortTH } from "@/components/data-table/sort-header";
import { DeleteAction, EditAction, ViewAction } from "@/components/data-table/row-actions";

export const metadata: Metadata = { title: "My items", robots: { index: false } };

const STATUSES = ["draft", "pending", "active", "sold", "adopted", "rejected"] as const;
const TYPES = ["cat", "adoption", "supply"] as const;
const SORTS = ["title", "price", "viewCount", "status", "createdAt"] as const;
const TONE = { draft: "gray", pending: "amber", active: "green", sold: "blue", adopted: "teal", rejected: "red" } as const;

type Props = { searchParams: Promise<SearchParams & { saved?: string }> };

export default async function MyItemsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const user = await requireUser("/dashboard/listings");
  const query = parseTableQuery(sp, { sorts: SORTS, defaultSort: "createdAt", filters: { status: STATUSES, type: TYPES } });

  const where: Prisma.ListingWhereInput = {
    sellerId: user.id,
    ...(query.filters.status ? { status: query.filters.status as (typeof STATUSES)[number] } : {}),
    ...(query.filters.type ? { type: query.filters.type as (typeof TYPES)[number] } : {}),
    ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy: { [query.sort]: query.dir },
      skip: (query.page - 1) * PAGE_SIZE_TABLE,
      take: PAGE_SIZE_TABLE,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        status: true,
        price: true,
        viewCount: true,
        createdAt: true,
        rejectionReason: true,
        catDetails: { select: { adoptionFee: true } },
        images: { select: { url: true }, orderBy: [{ isCover: "desc" }, { position: "asc" }], take: 1 },
      },
    }),
    db.listing.count({ where }),
  ]);
  const pages = Math.ceil(total / PAGE_SIZE_TABLE);
  const th = { basePath: "/dashboard/listings", searchParams: sp, query };

  return (
    <div className="space-y-5">
      <PageHeader
        title="My items"
        description="Everything you have posted. Edit, mark as sold or remove listings here."
        actions={
          <Link href="/sell/new" className={buttonClass("primary", "md")}>
            <Plus className="h-4 w-4" /> New listing
          </Link>
        }
      />
      {sp.saved === "active" && <Alert tone="green">Your listing is live!</Alert>}
      {sp.saved === "pending" && <Alert tone="blue">Saved. Your listing is waiting for moderator review.</Alert>}
      {sp.saved === "draft" && <Alert tone="blue">Draft saved.</Alert>}

      <TableToolbar
        placeholder="Search by title…"
        filters={[
          { name: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s })) },
          { name: "type", label: "Type", options: TYPES.map((s) => ({ value: s, label: s })) },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Cat className="h-10 w-10" />}
          title={total === 0 && !query.q && Object.keys(query.filters).length === 0 ? "No listings yet" : "No listings match your filters"}
          description="Post an ad to sell used cat supplies or find a loving home for a cat."
          action={<Link href="/sell/new" className={buttonClass()}>Post an ad</Link>}
        />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <SortTH label="Item" field="title" {...th} />
                <SortTH label="Status" field="status" {...th} />
                <SortTH label="Price" field="price" {...th} />
                <SortTH label="Views" field="viewCount" {...th} />
                <SortTH label="Posted" field="createdAt" {...th} />
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => {
                const closed = r.status === "sold" || r.status === "adopted";
                return (
                  <TR key={r.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <span className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-50 text-brand-300">
                          {r.images[0] ? (
                            <Image src={cldTransform(r.images[0].url, "f_auto,q_auto,c_fill,w_96,h_96")} alt="" fill sizes="48px" className="object-cover" />
                          ) : (
                            <Cat className="h-5 w-5" aria-hidden />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="max-w-[16rem] truncate font-medium">{r.title}</p>
                          <p className="text-xs capitalize text-muted">{r.type}</p>
                          {r.status === "rejected" && r.rejectionReason && (
                            <p className="max-w-[16rem] truncate text-xs text-red-600 dark:text-red-400">Reason: {r.rejectionReason}</p>
                          )}
                        </div>
                      </div>
                    </TD>
                    <TD><Badge tone={TONE[r.status]} className="capitalize">{r.status}</Badge></TD>
                    <TD className="whitespace-nowrap">{r.type === "adoption" ? (r.catDetails?.adoptionFee ? formatBDT(r.catDetails.adoptionFee) : "Free") : formatBDT(r.price)}</TD>
                    <TD>{r.viewCount}</TD>
                    <TD className="whitespace-nowrap text-muted">{timeAgo(r.createdAt)}</TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "active" && (
                          <form action={setListingStatusAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="action" value="sold" />
                            <button className={buttonClass("secondary", "sm")}>Mark {r.type === "adoption" ? "adopted" : "sold"}</button>
                          </form>
                        )}
                        {closed && (
                          <form action={setListingStatusAction}>
                            <input type="hidden" name="id" value={r.id} />
                            <input type="hidden" name="action" value="relist" />
                            <button className={buttonClass("outline", "sm")}>Relist</button>
                          </form>
                        )}
                        <ViewAction href={`/listing/${r.slug}`} label={r.title} />
                        {!closed && <EditAction href={`/dashboard/listings/${r.id}/edit`} label={r.title} />}
                        <DeleteAction id={r.id} label={r.title} action={deleteMyListingAction} />
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <p className="text-sm text-muted">
            Showing {(query.page - 1) * PAGE_SIZE_TABLE + 1}–{(query.page - 1) * PAGE_SIZE_TABLE + rows.length} of {total}
          </p>
          <Pagination basePath="/dashboard/listings" searchParams={sp} page={query.page} pages={pages} />
        </>
      )}
    </div>
  );
}
