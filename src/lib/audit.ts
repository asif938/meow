import "server-only";
import { db, type Prisma } from "@/db";

export async function audit(
  actorId: string,
  action: string,
  targetType: string,
  targetId?: string | null,
  meta?: Record<string, unknown>,
) {
  await db.auditLog.create({
    data: { actorId, action, targetType, targetId: targetId ?? null, meta: meta as Prisma.InputJsonObject | undefined },
  });
}
