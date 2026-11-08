import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getInbox } from "@/lib/inbox";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ conversations: await getInbox(user.id) });
}
