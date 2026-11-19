import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { cloudinaryEnabled, signUpload } from "@/lib/cloudinary";

/** Returns a short-lived signature for a direct browser → Cloudinary upload. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!cloudinaryEnabled) return NextResponse.json({ error: "Image uploads are not configured" }, { status: 503 });

  const { purpose } = (await req.json().catch(() => ({}))) as { purpose?: string };
  if (purpose === "blog" && !user.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const folder =
    purpose === "verification"
      ? `meow/verification/${user.id}`
      : purpose === "avatar"
        ? `meow/avatars/${user.id}`
        : purpose === "blog"
          ? "meow/blog"
          : `meow/listings/${user.id}`;
  return NextResponse.json(signUpload(folder));
}
