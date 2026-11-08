import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { actionResponse, toFormData } from "@/lib/api";
import { createOrderAction, updateOrderStatusAction } from "@/actions/orders";

/** POST { listingId, quantity, name, phone, line, district, note? } — cash on delivery. */
export async function POST(req: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return actionResponse(await createOrderAction(undefined, toFormData(body)));
}

/** PATCH { id, status } */
export async function PATCH(req: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    await updateOrderStatusAction(toFormData(body));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Not allowed" }, { status: 400 });
  }
}
