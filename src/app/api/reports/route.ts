import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { actionResponse, toFormData } from "@/lib/api";
import { createReportAction } from "@/actions/reports";

/** POST { targetType: "listing" | "user", targetId, reason, details? } */
export async function POST(req: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return actionResponse(await createReportAction(undefined, toFormData(body)));
}
