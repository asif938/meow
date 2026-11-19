import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/db";
import type { Prisma } from "@/db";
import { deletePostAction } from "@/actions/content";
import { parseTableQuery, PAGE_SIZE_TABLE, type SearchParams } from "@/lib/table";
import { timeAgo } from "@/lib/utils";
import { Badge, EmptyState, PageHeader, Table, TBody, TD, THead, TH, TR, buttonClass } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { TableToolbar } from "@/components/data-table/toolbar";
import { SortTH } from "@/components/data-table/sort-header";
import { DeleteAction, EditAction, ViewAction } from "@/components/data-table/row-actions";

const SORTS = ["title", "category", "createdAt"] as const;
const STATES = ["published", "draft"] as const;

export default async function AdminBlogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const query = parseTableQuery(sp, { sorts: SORTS, defaultSort: "createdAt", filters: { state: STATES } });
  const where: Prisma.BlogPostWhereInput = {
    ...(query.filters.state ? { isPublished: query.filters.state === "published" } : {}),
    ...(query.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: { [query.sort]: query.dir },
      skip: (query.page - 1) * PAGE_SIZE_TABLE,
      take: PAGE_SIZE_TABLE,
      select: { id: true, slug: true, title: true, category: true, isPublished: true, createdAt: true, author: { select: { name: true } } },
    }),
    db.blogPost.count({ where }),
  ]);
  const th = { basePath: "/admin/blog", searchParams: sp, query };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Blog posts"
        description="Articles shown on the public blog and the home page."
        actions={
          <Link href="/admin/blog/new" className={buttonClass("primary", "md")}>
            <Plus className="h-4 w-4" /> New post
          </Link>
        }
      />
      <TableToolbar
        placeholder="Search by title…"
        filters={[{ name: "state", label: "State", options: STATES.map((s) => ({ value: s, label: s })) }]}
      />
      {rows.length === 0 ? (
        <EmptyState title="No posts found" action={<Link href="/admin/blog/new" className={buttonClass()}>Write the first post</Link>} />
      ) : (
        <>
          <Table>
            <THead>
              <TR>
                <SortTH label="Title" field="title" {...th} />
                <SortTH label="Category" field="category" {...th} />
                <TH>State</TH>
                <TH>Author</TH>
                <SortTH label="Created" field="createdAt" {...th} />
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((p) => (
                <TR key={p.id}>
                  <TD><p className="max-w-xs truncate font-medium">{p.title}</p></TD>
                  <TD>{p.category}</TD>
                  <TD><Badge tone={p.isPublished ? "green" : "gray"}>{p.isPublished ? "Published" : "Draft"}</Badge></TD>
                  <TD className="text-muted">{p.author?.name ?? "—"}</TD>
                  <TD className="whitespace-nowrap text-muted">{timeAgo(p.createdAt)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <ViewAction href={`/blog/${p.slug}`} label={p.title} />
                      <EditAction href={`/admin/blog/${p.id}`} label={p.title} />
                      <DeleteAction id={p.id} label={p.title} action={deletePostAction} />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination basePath="/admin/blog" searchParams={sp} page={query.page} pages={Math.ceil(total / PAGE_SIZE_TABLE)} />
        </>
      )}
    </div>
  );
}
