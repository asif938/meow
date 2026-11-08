"use client";

import { memo, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { setUserStatusAction } from "@/actions/admin";
import type { UserRowData } from "@/lib/dashboard-types";
import { Badge, Input, buttonClass } from "@/components/ui";
import { SearchBox } from "@/components/dashboard/search-box";
import { VirtualList } from "@/components/dashboard/virtual-list";

const GRID = "grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,2fr)_1fr_1.2fr_0.8fr_1fr_minmax(0,1.6fr)] md:items-center md:gap-4";

const UserRow = memo(function UserRow({ u }: { u: UserRowData }) {
  return (
    <div className={`${GRID} border-b border-line bg-white px-4 py-3 text-sm`}>
      <div className="min-w-0">
        <Link href={`/seller/${u.username}`} className="font-medium hover:underline">{u.name}</Link>
        <p className="truncate text-xs text-muted">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p>
      </div>
      <div className="text-xs">{u.roles}</div>
      <div className="text-xs">{u.seller}</div>
      <div className="text-xs text-muted">{u.joined}</div>
      <div>
        <Badge tone={u.status === "banned" ? "red" : "green"}>{u.status}</Badge>
        {u.banReason && <p className="mt-1 text-xs text-muted">{u.banReason}</p>}
      </div>
      <form action={setUserStatusAction} className="flex items-center gap-2">
        <input type="hidden" name="userId" value={u.id} />
        {u.status === "active" ? (
          <>
            <Input name="reason" placeholder="Reason" aria-label={`Ban reason for ${u.name}`} className="h-8 w-28" />
            <button name="status" value="banned" className={buttonClass("danger", "sm")}>Ban</button>
          </>
        ) : (
          <button name="status" value="active" className={buttonClass("outline", "sm")}>Unban</button>
        )}
      </form>
    </div>
  );
});

export function UsersTable({ users }: { users: UserRowData[] }) {
  const [query, setQuery] = useState("");
  const indexed = useMemo(
    () => users.map((u) => ({ u, hay: `${u.name} ${u.email} ${u.username} ${u.phone ?? ""}`.toLowerCase() })),
    [users],
  );
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? indexed.filter((x) => x.hay.includes(q)).map((x) => x.u) : users;
  }, [indexed, users, query]);

  const handleSearch = useCallback((q: string) => setQuery(q), []);
  const getKey = useCallback((u: UserRowData) => u.id, []);
  const renderRow = useCallback((u: UserRowData) => <UserRow u={u} />, []);

  return (
    <div className="space-y-4">
      <SearchBox onSearch={handleSearch} placeholder="Search name, email, phone…" label="Search users" className="max-w-md" />
      <p className="text-sm text-muted" aria-live="polite">
        {visible.length.toLocaleString()} of {users.length.toLocaleString()} users
      </p>
      <div className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className={`${GRID} hidden border-b border-line bg-stone-50 px-4 py-3 text-xs font-medium uppercase text-muted md:grid`} aria-hidden>
          <span>User</span><span>Roles</span><span>Seller</span><span>Joined</span><span>Status</span><span />
        </div>
        {visible.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No users match your search.</p>
        ) : (
          <VirtualList
            items={visible}
            getKey={getKey}
            estimateSize={72}
            gap={0}
            overscan={8}
            renderRow={renderRow}
            label="Users"
            className="h-[65vh] min-h-[360px] overflow-y-auto overscroll-contain"
          />
        )}
      </div>
    </div>
  );
}
