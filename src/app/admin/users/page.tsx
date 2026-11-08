import { db } from "@/db";
import { timeAgo } from "@/lib/utils";
import { demoCount, demoUsers } from "@/lib/perf-data";
import type { UserRowData } from "@/lib/dashboard-types";
import { UsersTable } from "@/components/admin/users-table";

type Props = { searchParams: Promise<{ demo?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const { demo } = await searchParams;
  const n = demoCount(demo);

  // Search + virtualized rendering happen in the client island, so the server just ships a
  // slim, pre-formatted page of users (up to 2,000) instead of re-querying on every search.
  const rows: UserRowData[] = n
    ? demoUsers(n)
    : (
        await db.user.findMany({
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
            status: true,
            banReason: true,
            createdAt: true,
            roles: true,
            sellerProfile: { select: { verificationStatus: true, type: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 2000,
        })
      ).map((u) => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        roles: u.roles.map((r) => r.role).join(", "),
        seller: u.sellerProfile ? `${u.sellerProfile.type} (${u.sellerProfile.verificationStatus})` : "—",
        joined: timeAgo(u.createdAt),
        status: u.status as UserRowData["status"],
        banReason: u.banReason,
      }));

  return <UsersTable users={rows} />;
}
