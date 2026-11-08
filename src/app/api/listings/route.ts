import { NextResponse, type NextRequest } from "next/server";
import { parseFilters, searchListings } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { saveListingAction } from "@/actions/listings";

/** GET /api/listings?q=&type=&category=&min=&max=&division=&district=&breed=&sort=&page= */
export async function GET(req: NextRequest) {
  const filters = parseFilters(Object.fromEntries(req.nextUrl.searchParams));
  return NextResponse.json(await searchListings(filters));
}

/** POST /api/listings — same payload as the sell wizard. */
export async function POST(req: NextRequest) {
  if (!(await getCurrentUser())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await saveListingAction(await req.json().catch(() => null));
  return NextResponse.json(res, { status: res.ok ? 201 : 400 });
}
