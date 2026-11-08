import type { MetadataRoute } from "next";
import { db } from "@/db";
import { appUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["", "/cats", "/adopt", "/shop", "/about", "/safety", "/terms", "/privacy"].map((p) => ({
    url: appUrl(p),
    changeFrequency: "daily" as const,
    priority: p === "" ? 1 : 0.7,
  }));

  try {
    const [rows, cats] = await Promise.all([
      db.listing.findMany({
        where: { status: "active" },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 45000,
      }),
      db.category.findMany({ where: { isActive: true }, select: { slug: true } }),
    ]);
    return [
      ...statics,
      ...cats.map((c) => ({ url: appUrl(`/category/${c.slug}`), changeFrequency: "daily" as const, priority: 0.6 })),
      ...rows.map((r) => ({ url: appUrl(`/listing/${r.slug}`), lastModified: r.updatedAt, priority: 0.8 })),
    ];
  } catch {
    return statics;
  }
}
