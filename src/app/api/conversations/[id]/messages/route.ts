import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";
import { getConversationFor } from "@/lib/chat";
import { sendMessageAction } from "@/actions/chat";

type Ctx = { params: Promise<{ id: string }> };

/** Polling endpoint: GET ?after=<ISO timestamp> returns newer messages. */
export async function GET(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const convo = await getConversationFor(user.id, id);
  if (!convo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const after = req.nextUrl.searchParams.get("after");
  const afterDate = after && !Number.isNaN(Date.parse(after)) ? new Date(after) : null;

  const rows = await db.message.findMany({
    where: { conversationId: id, ...(afterDate ? { createdAt: { gt: afterDate } } : {}) },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  if (rows.some((m) => m.senderId !== user.id && !m.readAt)) {
    await db.message.updateMany({
      where: { conversationId: id, senderId: { not: user.id }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  return NextResponse.json({
    messages: rows.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      flagged: m.flagged,
      createdAt: m.createdAt.toISOString(),
      readAt: m.readAt?.toISOString() ?? null,
    })),
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { body?: string };
  const res = await sendMessageAction(id, String(body.body ?? ""));
  if (res.error) return NextResponse.json(res, { status: 400 });
  return NextResponse.json(res);
}
