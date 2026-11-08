import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { actionResponse, toFormData } from "@/lib/api";
import { createAdoptionRequestAction, updateAdoptionRequestAction } from "@/actions/adoption";

/** POST { listingId, message, homeType, otherPets, experience, phone? } */
export async function POST(req: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  return actionResponse(await createAdoptionRequestAction(undefined, toFormData(body)));
}

/** PATCH { id, decision: "approve" | "reject" | "complete", note? } — listing owner only. */
export async function PATCH(req: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    await updateAdoptionRequestAction(toFormData(body));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
}
