import { db } from "@/db";
import type { Prisma } from "@/db";
import { deleteContactMessageAction, setContactStatusAction } from "@/actions/content";
import { parseTableQuery, PAGE_SIZE_TABLE, type SearchParams } from "@/lib/table";
import { timeAgo } from "@/lib/utils";
import { Badge, EmptyState, PageHeader, Table, TBody, TD, THead, TH, TR, buttonClass } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { TableToolbar } from "@/components/data-table/toolbar";
import { SortTH } from "@/components/data-table/sort-header";
import { DeleteAction } from "@/components/data-table/row-actions";

const SORTS = ["name", "subject", "status", "createdAt"] as const;
const STATUSES = ["new", "read", "resolved"] as const;
const TONE = { new: "amber", read: "blue", resolved: "green" } as const;

export default async function AdminMessagesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const query = parseTableQuery(sp, { sorts: SORTS, defaultSort: "createdAt", filters: { status: STATUSES } });
  const where: Prisma.ContactMessageWhereInput = {
    ...(query.filters.status ? { status: query.filters.status as (typeof STATUSES)[number] } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
            { subject: { contains: query.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.contactMessage.findMany({ where, orderBy: { [query.sort]: query.dir }, skip: (query.page - 1) * PAGE_SIZE_TABLE, take: PAGE_SIZE_TABLE }),
    db.contactMessage.count({ where }),
  ]);
  const th = { basePath: "/admin/messages", searchParams: sp, query };

  return (
    <div className="space-y-5">
      <PageHeader title="Contact messages" description="Messages sent from the public contact form." />
      <TableToolbar
        placeholder="Search name, email, subject…"
        filters={[{ name: "status", label: "Status", options: STATUSES.map((s) => ({ value: s, label: s })) }]}
      />
      {rows.length === 0 ? (
        <EmptyState title="No messages" description="Nothing here yet." />
      ) : (
        <>
          <Table className="min-w-[760px]">
            <THead>
              <TR>
                <SortTH label="From" field="name" {...th} />
                <SortTH label="Subject" field="subject" {...th} />
                <TH>Message</TH>
                <SortTH label="Status" field="status" {...th} />
                <SortTH label="Received" field="createdAt" {...th} />
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((m) => (
                <TR key={m.id} className="align-top">
                  <TD>
                    <p className="font-medium">{m.name}</p>
                    <a href={`mailto:${m.email}`} className="text-xs text-brand-600 hover:underline">{m.email}</a>
                  </TD>
                  <TD className="max-w-[12rem]">{m.subject}</TD>
                  <TD className="max-w-sm whitespace-pre-line text-muted">{m.message}</TD>
                  <TD><Badge tone={TONE[m.status]} className="capitalize">{m.status}</Badge></TD>
                  <TD className="whitespace-nowrap text-muted">{timeAgo(m.createdAt)}</TD>
                  <TD>
                    <div className="flex items-center justify-end gap-1">
                      <form action={setContactStatusAction} className="flex gap-1">
                        <input type="hidden" name="id" value={m.id} />
                        {m.status !== "read" && <button name="status" value="read" className={buttonClass("outline", "sm")}>Mark read</button>}
                        {m.status !== "resolved" && <button name="status" value="resolved" className={buttonClass("secondary", "sm")}>Resolve</button>}
                      </form>
                      <DeleteAction id={m.id} label={`message from ${m.name}`} action={deleteContactMessageAction} />
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <Pagination basePath="/admin/messages" searchParams={sp} page={query.page} pages={Math.ceil(total / PAGE_SIZE_TABLE)} />
        </>
      )}
    </div>
  );
}
