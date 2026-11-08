import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/db";
import { getListingBySlug } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { saveListingAction, setListingStatusAction } from "@/actions/listings";

type Ctx = { params: Promise<{ id: string }> };

async function findSlug(id: string) {
  const row = await db.listing.findUnique({ where: { id }, select: { slug: true } });
  return row?.slug;
}

export async function GET(_: NextRequest, { params }: Ctx) {
  const slug = await findSlug((await params).id).catch(() => undefined);
  const listing = slug ? await getListingBySlug(slug) : null;
  if (!listing || listing.status !== "active") return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Never expose seller contact details through the public API.
  const { seller, ...rest } = listing;
  return NextResponse.json({ ...rest, seller: { id: seller.id, name: seller.name, username: seller.username } });
}

/** PATCH with { action: "sold" | "relist" | "unpublish" } or a full listing payload to edit. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (typeof body.action === "string") {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("action", body.action);
    try {
      await setListingStatusAction(fd);
      return NextResponse.json({ ok: true });
    } catch {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
  }
  const res = await saveListingAction(body, id);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

export async function DELETE(_: NextRequest, { params }: Ctx) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const fd = new FormData();
  fd.set("id", (await params).id);
  fd.set("action", "delete");
  try {
    await setListingStatusAction(fd);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
}
