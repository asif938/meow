import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/db";

/** Live platform numbers shown in the hero and the stats section (cached 5 minutes). */
export const getPlatformStats = unstable_cache(
  async () => {
    const [listings, sellers, users, adopted, delivered, reviews] = await Promise.all([
      db.listing.count({ where: { status: "active" } }),
      db.sellerProfile.count({ where: { verificationStatus: "approved" } }),
      db.user.count({ where: { status: "active" } }),
      db.adoptionRequest.count({ where: { status: "completed" } }),
      db.order.count({ where: { status: "delivered" } }),
      db.review.aggregate({ _avg: { rating: true }, _count: true }),
    ]);
    return {
      listings,
      sellers,
      users,
      adoptions: adopted,
      orders: delivered,
      reviews: reviews._count,
      rating: reviews._avg.rating ? Math.round(reviews._avg.rating * 10) / 10 : null,
    };
  },
  ["platform-stats"],
  { revalidate: 300 },
);

export type PlatformStats = Awaited<ReturnType<typeof getPlatformStats>>;

/** Real buyer reviews (4★ and up, with a written comment). */
export async function getTestimonials(limit = 6) {
  return db.review.findMany({
    where: { rating: { gte: 4 }, comment: { not: null } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      reviewer: { select: { name: true, avatar: true } },
      seller: { select: { name: true, username: true, sellerProfile: { select: { shopName: true } } } },
    },
  });
}

/** Verified shops, shelters and sellers, ranked by number of active listings. */
export async function getTrustedSellers(limit = 6) {
  const rows = await db.sellerProfile.findMany({
    where: { verificationStatus: "approved" },
    select: {
      type: true,
      shopName: true,
      bio: true,
      user: { select: { id: true, name: true, username: true, avatar: true, _count: { select: { listings: { where: { status: "active" } } } } } },
    },
    take: 24,
  });
  return rows
    .map((r) => ({
      id: r.user.id,
      name: r.shopName ?? r.user.name,
      username: r.user.username,
      avatar: r.user.avatar,
      type: r.type,
      bio: r.bio,
      listings: r.user._count.listings,
    }))
    .sort((a, b) => b.listings - a.listings)
    .slice(0, limit);
}

export const BLOG_PAGE_SIZE = 9;

const postCard = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverUrl: true,
  category: true,
  readMinutes: true,
  publishedAt: true,
} as const;

export async function getLatestPosts(limit = 3) {
  return db.blogPost.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: postCard,
  });
}

export async function listPosts({ q, category, page = 1 }: { q?: string; category?: string; page?: number }) {
  const where = {
    isPublished: true,
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { excerpt: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const [items, total, categories] = await Promise.all([
    db.blogPost.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * BLOG_PAGE_SIZE,
      take: BLOG_PAGE_SIZE,
      select: postCard,
    }),
    db.blogPost.count({ where }),
    db.blogPost.groupBy({ by: ["category"], where: { isPublished: true }, _count: true, orderBy: { category: "asc" } }),
  ]);
  return { items, total, pages: Math.ceil(total / BLOG_PAGE_SIZE), page, categories: categories.map((c) => c.category) };
}

export async function getPostBySlug(slug: string) {
  return db.blogPost.findFirst({
    where: { slug, isPublished: true },
    include: { author: { select: { name: true } } },
  });
}

export async function getRelatedPosts(slug: string, category: string, limit = 3) {
  return db.blogPost.findMany({
    where: { isPublished: true, slug: { not: slug }, category },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: postCard,
  });
}
