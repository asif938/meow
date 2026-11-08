import "server-only";
import { cache } from "react";
import { Prisma, db } from "@/db";
import type { CatGender, ListingCondition, ListingStatus, ListingType, SellerType } from "@/db/types";

export const PAGE_SIZE = 24;

export type ListingFilters = {
  q?: string;
  type?: ListingType;
  category?: string;
  condition?: "new" | "used";
  minPrice?: number;
  maxPrice?: number;
  division?: string;
  district?: string;
  breed?: string;
  gender?: "male" | "female";
  vaccinated?: boolean;
  verified?: boolean;
  sellerId?: string;
  sort?: "newest" | "price_asc" | "price_desc" | "popular" | "relevance";
  page?: number;
  featured?: boolean;
  limit?: number;
  ids?: string[];
};

export function parseFilters(sp: Record<string, string | string[] | undefined>): ListingFilters {
  const get = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
  };
  const num = (k: string) => {
    const v = get(k);
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
  };
  const type = get("type");
  const condition = get("condition");
  const gender = get("gender");
  const sort = get("sort");
  return {
    q: get("q")?.slice(0, 100),
    type: type === "cat" || type === "supply" || type === "adoption" ? type : undefined,
    category: get("category"),
    condition: condition === "new" || condition === "used" ? condition : undefined,
    minPrice: num("min"),
    maxPrice: num("max"),
    division: get("division"),
    district: get("district"),
    breed: get("breed"),
    gender: gender === "male" || gender === "female" ? gender : undefined,
    vaccinated: get("vaccinated") === "1" ? true : undefined,
    verified: get("verified") === "1" ? true : undefined,
    sort: (["newest", "price_asc", "price_desc", "popular", "relevance"] as const).find((s) => s === sort),
    page: Math.max(1, num("page") ?? 1),
  };
}

export type ListingCard = {
  id: string;
  slug: string;
  title: string;
  type: ListingType;
  condition: ListingCondition | null;
  price: number;
  isNegotiable: boolean;
  status: ListingStatus;
  createdAt: Date;
  cover: string | null;
  district: string | null;
  area: string | null;
  breed: string | null;
  ageMonths: number | null;
  gender: CatGender | null;
  vaccinated: boolean | null;
  adoptionFee: number | null;
  sellerVerified: boolean;
  sellerType: SellerType | null;
};

export const getCategories = cache(async () => {
  return db.category.findMany({
    where: { isActive: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
  });
});

export const getLocations = cache(async () => {
  return db.location.findMany({
    orderBy: [{ division: "asc" }, { district: "asc" }, { area: "asc" }],
  });
});

async function categoryIdsFor(slug: string) {
  const all = await getCategories();
  const root = all.find((c) => c.slug === slug);
  if (!root) return [];
  const ids = new Set([root.id]);
  // Walk the tree (supports any depth).
  let added = true;
  while (added) {
    added = false;
    for (const c of all) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        added = true;
      }
    }
  }
  return [...ids];
}

// Text params are cast explicitly: raw queries don't get Prisma's automatic enum/uuid typing.
const uuid = (v: string) => Prisma.sql`${v}::uuid`;

export async function searchListings(f: ListingFilters) {
  const where: Prisma.Sql[] = [Prisma.sql`l.status = 'active'::listing_status`];

  if (f.type) where.push(Prisma.sql`l.type = ${f.type}::listing_type`);
  if (f.condition) where.push(Prisma.sql`l.condition = ${f.condition}::listing_condition`);
  if (f.minPrice !== undefined) where.push(Prisma.sql`l.price >= ${f.minPrice}`);
  if (f.maxPrice !== undefined) where.push(Prisma.sql`l.price <= ${f.maxPrice}`);
  if (f.division) where.push(Prisma.sql`loc.division = ${f.division}`);
  if (f.district) where.push(Prisma.sql`loc.district = ${f.district}`);
  if (f.breed) where.push(Prisma.sql`cd.breed ilike ${`%${f.breed}%`}`);
  if (f.gender) where.push(Prisma.sql`cd.gender = ${f.gender}::cat_gender`);
  if (f.vaccinated) where.push(Prisma.sql`cd.vaccinated = true`);
  if (f.verified) where.push(Prisma.sql`sp.verification_status = 'approved'::verification_status`);
  if (f.sellerId) where.push(Prisma.sql`l.seller_id = ${uuid(f.sellerId)}`);
  if (f.featured) where.push(Prisma.sql`l.is_featured = true`);
  if (f.ids) {
    where.push(f.ids.length ? Prisma.sql`l.id in (${Prisma.join(f.ids.map(uuid))})` : Prisma.sql`false`);
  }
  if (f.category) {
    const ids = await categoryIdsFor(f.category);
    if (ids.length === 0) return { items: [] as ListingCard[], total: 0, page: 1, pages: 0 };
    where.push(Prisma.sql`l.category_id in (${Prisma.join(ids.map(uuid))})`);
  }

  let rank: Prisma.Sql | undefined;
  if (f.q) {
    const tsq = Prisma.sql`websearch_to_tsquery('simple', ${f.q})`;
    where.push(
      Prisma.sql`(
        l.search @@ ${tsq}
        or l.title % ${f.q}
        or l.title ilike ${`%${f.q}%`}
        or cd.breed ilike ${`%${f.q}%`}
      )`,
    );
    rank = Prisma.sql`ts_rank(l.search, ${tsq}) + similarity(l.title, ${f.q})`;
  }

  const sort = f.sort ?? (f.q ? "relevance" : "newest");
  const orderBy: Prisma.Sql[] = [Prisma.sql`l.is_featured desc`];
  if (sort === "price_asc") orderBy.splice(0, 1, Prisma.sql`l.price asc`);
  else if (sort === "price_desc") orderBy.splice(0, 1, Prisma.sql`l.price desc`);
  else if (sort === "popular") orderBy.push(Prisma.sql`l.view_count desc`);
  else if (sort === "relevance" && rank) orderBy.splice(0, 1, Prisma.sql`(${rank}) desc`);
  orderBy.push(Prisma.sql`l.created_at desc`);

  const limit = f.limit ?? PAGE_SIZE;
  const page = f.page ?? 1;

  const rows = await db.$queryRaw<(ListingCard & { total: number })[]>(Prisma.sql`
    select
      l.id,
      l.slug,
      l.title,
      l.type,
      l.condition,
      l.price,
      l.is_negotiable as "isNegotiable",
      l.status,
      l.created_at as "createdAt",
      (
        select li.url from listing_images li
        where li.listing_id = l.id
        order by li.is_cover desc, li.position asc
        limit 1
      ) as cover,
      loc.district,
      loc.area,
      cd.breed,
      cd.age_months as "ageMonths",
      cd.gender,
      cd.vaccinated,
      cd.adoption_fee as "adoptionFee",
      coalesce(sp.verification_status = 'approved', false) as "sellerVerified",
      sp.type as "sellerType",
      count(*) over()::int as total
    from listings l
    left join locations loc on loc.id = l.location_id
    left join cat_details cd on cd.listing_id = l.id
    left join seller_profiles sp on sp.user_id = l.seller_id
    where ${Prisma.join(where, " and ")}
    order by ${Prisma.join(orderBy, ", ")}
    limit ${limit}
    offset ${(page - 1) * limit}
  `);

  const total = rows[0]?.total ?? 0;
  return { items: rows as ListingCard[], total, page, pages: Math.ceil(total / limit) };
}

export async function getListingBySlug(slug: string) {
  return db.listing.findUnique({
    where: { slug },
    include: {
      images: { orderBy: [{ isCover: "desc" }, { position: "asc" }] },
      catDetails: true,
      category: { include: { parent: true } },
      location: true,
      seller: {
        select: {
          id: true,
          name: true,
          username: true,
          avatar: true,
          createdAt: true,
          isPhoneVerified: true,
          phone: true,
          sellerProfile: true,
        },
      },
    },
  });
}

export async function getSellerRating(sellerId: string) {
  const agg = await db.review.aggregate({
    where: { sellerId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const avg = agg._avg.rating;
  return { avg: avg === null ? null : Math.round(avg * 10) / 10, count: agg._count._all };
}

export async function getSellerByUsername(username: string) {
  return db.user.findUnique({
    where: { username },
    omit: { passwordHash: true, email: true, phone: true },
    include: { sellerProfile: true, location: true },
  });
}

export async function getUserByShopSlug(slug: string) {
  const sp = await db.sellerProfile.findUnique({ where: { slug }, select: { userId: true } });
  return sp?.userId ?? null;
}

export async function getWishedIds(userId: string, listingIds: string[]) {
  if (listingIds.length === 0) return new Set<string>();
  const rows = await db.wishlist.findMany({
    where: { userId, listingId: { in: listingIds } },
    select: { listingId: true },
  });
  return new Set(rows.map((r) => r.listingId));
}
