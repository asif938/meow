import { db } from "@/db";
import type { Prisma } from "@/db";
import { requireAdmin } from "@/lib/session";
import { parseTableQuery, PAGE_SIZE_TABLE, type SearchParams } from "@/lib/table";
import { timeAgo } from "@/lib/utils";
import { deleteUserAction } from "@/actions/admin";
import { Badge, EmptyState, PageHeader, Table, TBody, TD, THead, TH, TR } from "@/components/ui";
import { Pagination } from "@/components/pagination";
import { TableToolbar } from "@/components/data-table/toolbar";
import { SortTH } from "@/components/data-table/sort-header";
import { DeleteAction, ViewAction } from "@/components/data-table/row-actions";
import { EditUserButton } from "./edit-user";

const SORTS = ["name", "email", "createdAt", "status"] as const;
const STATUSES = ["active", "banned"] as const;
const ROLES = ["buyer", "seller", "business", "shelter", "admin"] as const;

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const admin = await requireAdmin();
  const query = parseTableQuery(sp, { sorts: SORTS, defaultSort: "createdAt", filters: { status: STATUSES, role: ROLES } });

  const where: Prisma.UserWhereInput = {
    ...(query.filters.status ? { status: query.filters.status as (typeof STATUSES)[number] } : {}),
    ...(query.filters.role ? { roles: { some: { role: query.filters.role as (typeof ROLES)[number] } } } : {}),
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: "insensitive" } },
            { email: { contains: query.q, mode: "insensitive" } },
            { username: { contains: query.q, mode: "insensitive" } },
            { phone: { contains: query.q } },
          ],
        }
      : {}),
  };
  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { [query.sort]: query.dir },
      skip: (query.page - 1) * PAGE_SIZE_TABLE,
      take: PAGE_SIZE_TABLE,
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        status: true,
        banReason: true,
        createdAt: true,
        roles: { select: { role: true } },
        _count: { select: { listings: true } },
      },
    }),
    db.user.count({ where }),
  ]);
  const th = { basePath: "/admin/users", searchParams: sp, query };

  return (
    <div className="space-y-5">
      <PageHeader title="Manage users" description={`${total.toLocaleString()} account${total === 1 ? "" : "s"} match your filters.`} />
      <TableToolbar
        placeholder="Search name, email, phone…"
        filters={[
          { name: "role", label: "Role", options: ROLES.map((r) => ({ value: r, label: r })) },
          { name: "status", label: "Status", options: STATUSES.map((r) => ({ value: r, label: r })) },
        ]}
      />
      {rows.length === 0 ? (
        <EmptyState title="No users found" description="Try a different search or clear the filters." />
      ) : (
        <>
          <Table className="min-w-[760px]">
            <THead>
              <TR>
                <SortTH label="User" field="name" {...th} />
                <TH>Roles</TH>
                <TH>Listings</TH>
                <SortTH label="Joined" field="createdAt" {...th} />
                <SortTH label="Status" field="status" {...th} />
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((u) => {
                const isAdmin = u.roles.some((r) => r.role === "admin");
                const self = u.id === admin.id;
                return (
                  <TR key={u.id}>
                    <TD>
                      <p className="font-medium">{u.name}</p>
                      <p className="max-w-[16rem] truncate text-xs text-muted">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {u.roles.map((r) => (
                          <Badge key={r.role} tone={r.role === "admin" ? "brand" : "gray"} className="capitalize">{r.role}</Badge>
                        ))}
                      </div>
                    </TD>
                    <TD>{u._count.listings}</TD>
                    <TD className="whitespace-nowrap text-muted">{timeAgo(u.createdAt)}</TD>
                    <TD>
                      <Badge tone={u.status === "banned" ? "red" : "green"}>{u.status}</Badge>
                      {u.banReason && <p className="mt-1 max-w-[12rem] truncate text-xs text-muted">{u.banReason}</p>}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-1">
                        <ViewAction href={`/seller/${u.username}`} label={u.name} />
                        {!self && (
                          <>
                            <EditUserButton user={{ id: u.id, name: u.name, status: u.status, banReason: u.banReason, isAdmin }} />
                            <DeleteAction
                              id={u.id}
                              label={u.name}
                              action={deleteUserAction}
                              description={`${u.name}'s account and listings will be deleted permanently. Users with orders cannot be deleted; ban them instead.`}
                            />
                          </>
                        )}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
          <Pagination basePath="/admin/users" searchParams={sp} page={query.page} pages={Math.ceil(total / PAGE_SIZE_TABLE)} />
        </>
      )}
    </div>
  );
}
