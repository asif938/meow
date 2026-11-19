import Link from "next/link";
import Image from "next/image";
import { Cat } from "lucide-react";
import { db } from "@/db";
import type { Prisma } from "@/db";
import { deleteListingAdminAction } from "@/actions/admin";
import { cldTransform } from "@/lib/cloudinary";
import { parseTableQuery, PAGE_SIZE_TABLE, type SearchParams } from "@/lib/table";
import { formatBDT, timeAgo } from "@/lib/utils";
import { Badge, EmptyState, PageHeader, Table, TBody, TD, THead, TH, TR } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { TableToolbar } from "@/components/data-table/toolbar";
import { SortTH } from "@/components/data-table/sort-header";
import { DeleteAction, EditAction, ViewAction } from "@/components/data-table/row-actions";

const STATUSES = ["pending", "active", "rejected", "sold", "adopted", "draft"] as const;
const TYPES = ["cat", "adoption", "supply"] as const;
const SORTS = ["title", "price", "status", "viewCount", "createdAt"] as const;
const TONE = { draft: "gray", pending: "amber", active: "green", sold: "blue", adopted: "teal", rejected: "red" } as const;

export default async function AdminListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const query = parseTableQuery(sp, { sorts: SORTS, defaultSort: "createdAt", filters: { status: STATUSES, type: TYPES } });

  const where: Prisma.ListingWhereInput = {
    ...(query.filters.status ? { status: query.filters.status as (typeof STATUSES)[number] } : {}),
    ...(query.filters.type ? { type: query.filters.type as (typeof TYPES)[number] } : {}),
    ...(query.q
      ? { OR: [{ title: { contains: query.q, mode: "insensitive" } }, { seller: { name: { contains: query.q, mode: "insensitive" } } }] }
      : {}),
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
        isFeatured: true,
        createdAt: true,
        category: { select: { name: true } },
        seller: { select: { name: true, username: true } },
        catDetails: { select: { adoptionFee: true } },
        images: { select: { url: true }, orderBy: [{ isCover: "desc" }, { position: "asc" }], take: 1 },
      },
    }),
    db.listing.count({ where }),
  ]);
  const th = { basePath: "/admin/listings", searchParams: sp, query };

  return (
    <div className="space-y-5">
      <PageHeader title="Manage items" description="Review new listings, feature the best ones and remove anything that breaks the rules." />
      <TableToolbar
        placeholder="Search title or seller…"
        filters={[
          { name: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s })) },
          { name: "type", label: "Type", options: TYPES.map((s) => ({ value: s, label: s })) },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState title="No items found" description="Try a different search or clear the filters." />
      ) : (
        <>
          <Table className="min-w-[820px]">
            <THead>
              <TR>
                <SortTH label="Item" field="title" {...th} />
                <TH>Seller</TH>
                <SortTH label="Status" field="status" {...th} />
                <SortTH label="Price" field="price" {...th} />
                <SortTH label="Views" field="viewCount" {...th} />
                <SortTH label="Posted" field="createdAt" {...th} />
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r) => (
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
                        <Link href={`/admin/listings/${r.id}`} className="block max-w-[15rem] truncate font-medium hover:underline">{r.title}</Link>
                        <p className="text-xs text-muted"><span className="capitalize">{r.type}</span> · {r.category.name}</p>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Link href={`/seller/${r.seller.username}`} className="hover:underline">{r.seller.name}</Link>
                  </TD>
                  <TD>
                    <Badge tone={TONE[r.status]} className="capitalize">{r.status}</Badge>
                    {r.isFeatured && <Badge tone="amber" className="ml-1">Featured</Badge>}
                  </TD>
                  <TD className="whitespace-nowrap">{r.type === "adoption" ? (r.catDetails?.adoptionFee ? formatBDT(r.catDetails.adoptionFee) : "Free") : formatBDT(r.price)}</TD>
                  <TD>{r.viewCount}</TD>
                  <TD className="whitespace-nowrap text-muted">{timeAgo(r.createdAt)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <ViewAction href={`/listing/${r.slug}`} label={r.title} />
                      <EditAction href={`/admin/listings/${r.id}`} label={r.title} />
                      <DeleteAction id={r.id} label={r.title} action={deleteListingAdminAction} />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <p className="text-sm text-muted">
            Showing {(query.page - 1) * PAGE_SIZE_TABLE + 1}–{(query.page - 1) * PAGE_SIZE_TABLE + rows.length} of {total}
          </p>
          <Pagination basePath="/admin/listings" searchParams={sp} page={query.page} pages={Math.ceil(total / PAGE_SIZE_TABLE)} />
        </>
      )}
    </div>
  );
}
