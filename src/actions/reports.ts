"use server";

import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { reportSchema } from "@/lib/validation";
import { RULES } from "@/lib/constants";
import type { ActionState } from "@/lib/utils";

export async function createReportAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const n = await db.report.count({
    where: { reporterId: user.id, createdAt: { gt: new Date(Date.now() - 86_400_000) } },
  });
  if (n >= RULES.reportsPerDay) return { error: "You've sent a lot of reports today. Please try again tomorrow." };

  await db.report.create({ data: { ...parsed.data, reporterId: user.id } });
  return { ok: true, message: "Thanks — our moderators will review this shortly." };
}
