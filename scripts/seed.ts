/**
 * Seeds categories, locations, demo users and listings.
 *   npm run db:seed            (idempotent: skips rows that already exist)
 *   npm run db:seed -- --reset (deletes all listings/users first — dev only!)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import type { ListingCondition, ListingType, Role } from "../src/generated/prisma/client";
import { DHAKA_AREAS, DIVISIONS } from "../src/lib/constants";

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("ep-xxx")) {
  console.error("Set DATABASE_URL in .env.local first.");
  process.exit(1);
}

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL }) });
const DEMO_PASSWORD = "meow12345";
const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=1200&q=80`;

type Cat = {
  name: string;
  nameBn?: string;
  slug: string;
  icon?: string;
  listingType: ListingType;
  allowedConditions?: ListingCondition[];
  businessOnly?: boolean;
  requiresExpiry?: boolean;
  position: number;
};

const TREE: (Cat & { children?: string[] })[] = [
  {
    name: "Cats",
    nameBn: "বিড়াল",
    slug: "cats",
    icon: "cat",
    listingType: "cat",
    position: 0,
    children: ["Persian", "Siamese", "Maine Coon", "Bengal", "British Shorthair", "Local (Deshi)", "Mixed"],
  },
  {
    name: "Adoption",
    nameBn: "দত্তক",
    slug: "adoption",
    icon: "heart",
    listingType: "adoption",
    position: 1,
    children: ["Kitten", "Adult", "Senior", "Special needs"],
  },
  {
    name: "Food",
    nameBn: "খাবার",
    slug: "food",
    icon: "food",
    listingType: "supply",
    allowedConditions: ["new", "used"],
    requiresExpiry: true,
    position: 2,
    children: ["Dry food", "Wet food", "Kitten food", "Treats", "Prescription diet"],
  },
  {
    name: "Litter",
    nameBn: "লিটার",
    slug: "litter",
    icon: "litter",
    listingType: "supply",
    allowedConditions: ["new", "used"],
    position: 3,
    children: ["Cat litter", "Litter box", "Scoop", "Litter mats"],
  },
  {
    name: "Toys",
    nameBn: "খেলনা",
    slug: "toys",
    icon: "toys",
    listingType: "supply",
    allowedConditions: ["new", "used"],
    position: 4,
    children: ["Scratchers", "Tunnels", "Wand toys", "Balls"],
  },
  {
    name: "Health",
    nameBn: "স্বাস্থ্য",
    slug: "health",
    icon: "health",
    listingType: "supply",
    allowedConditions: ["new"],
    businessOnly: true,
    requiresExpiry: true,
    position: 5,
    children: ["Medicine", "Vitamins", "Flea & tick", "First aid"],
  },
  {
    name: "Grooming",
    nameBn: "গ্রুমিং",
    slug: "grooming",
    icon: "grooming",
    listingType: "supply",
    allowedConditions: ["new", "used"],
    position: 6,
    children: ["Brushes", "Shampoo", "Nail clippers", "Dryers"],
  },
  {
    name: "Accessories",
    nameBn: "এক্সেসরিজ",
    slug: "accessories",
    icon: "accessories",
    listingType: "supply",
    allowedConditions: ["new", "used"],
    position: 7,
    children: ["Collars", "Harness & leash", "Bowls", "Water fountains"],
  },
  {
    name: "Furniture",
    nameBn: "আসবাব",
    slug: "furniture",
    icon: "furniture",
    listingType: "supply",
    allowedConditions: ["new", "used"],
    position: 8,
    children: ["Cat trees", "Beds", "Houses", "Window perches"],
  },
  {
    name: "Travel",
    nameBn: "ভ্রমণ",
    slug: "travel",
    icon: "travel",
    listingType: "supply",
    allowedConditions: ["new", "used"],
    position: 9,
    children: ["Carriers", "Cages", "Travel bags", "Strollers"],
  },
];

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[()&]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

async function seedCategories() {
  for (const { children, ...parent } of TREE) {
    const p = await db.category.upsert({ where: { slug: parent.slug }, create: parent, update: {} });
    if (!children) continue;
    await db.category.createMany({
      skipDuplicates: true,
      data: children.map((name, i) => ({
          name,
          slug: `${parent.slug}-${slug(name)}`,
          parentId: p.id,
          listingType: parent.listingType,
          allowedConditions: parent.allowedConditions ?? [],
          businessOnly: parent.businessOnly ?? false,
          // Prescription diet behaves like medicine.
          ...(name === "Prescription diet" ? { businessOnly: true, allowedConditions: ["new" as const] } : {}),
          requiresExpiry: parent.requiresExpiry ?? false,
          position: i,
        })),
    });
  }
  console.log("✓ categories");
}

async function seedLocations() {
  const rows: { division: string; district: string; area: string | null }[] = [];
  for (const [division, districts] of Object.entries(DIVISIONS)) {
    for (const district of districts) rows.push({ division, district, area: null });
  }
  for (const area of DHAKA_AREAS) rows.push({ division: "Dhaka", district: "Dhaka", area });
  // NULL areas don't collide in a unique index, so dedupe manually.
  const existing = await db.location.findMany();
  const key = (r: { division: string; district: string; area?: string | null }) => `${r.division}|${r.district}|${r.area ?? ""}`;
  const have = new Set(existing.map(key));
  const fresh = rows.filter((r) => !have.has(key(r)));
  if (fresh.length) await db.location.createMany({ data: fresh });
  console.log(`✓ locations (+${fresh.length})`);
}

async function upsertUser(u: {
  name: string;
  username: string;
  email: string;
  phone?: string;
  roles: Role[];
  seller?: Omit<Prisma.SellerProfileUncheckedCreateInput, "userId">;
}) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await db.user.createMany({
    skipDuplicates: true,
    data: [
      {
        name: u.name,
        username: u.username,
        email: u.email,
        phone: u.phone,
        passwordHash,
        isEmailVerified: true,
        isPhoneVerified: Boolean(u.phone),
      },
    ],
  });
  const row = await db.user.findUniqueOrThrow({ where: { email: u.email } });
  await db.userRole.createMany({ data: u.roles.map((role) => ({ userId: row.id, role })), skipDuplicates: true });
  if (u.seller) await db.sellerProfile.createMany({ data: [{ userId: row.id, ...u.seller }], skipDuplicates: true });
  return row;
}

async function main() {
  if (process.argv.includes("--reset")) {
    console.log("Resetting demo data…");
    await db.$executeRaw`truncate listings, conversations, messages, adoption_requests, orders, order_items, wishlists, reviews, reports, audit_logs, otp_codes cascade`;
    await db.$executeRaw`truncate users cascade`;
  }

  await seedCategories();
  await seedLocations();

  const adminEmail = (process.env.ADMIN_EMAILS ?? "admin@meow.com.bd").split(",")[0].trim().toLowerCase();
  const admin = await upsertUser({ name: "Meow Admin", username: "admin", email: adminEmail, phone: "+8801700000000", roles: ["buyer", "admin"] });
  const shop = await upsertUser({
    name: "Rafiq Hasan",
    username: "purrfectpets",
    email: "shop@meow.com.bd",
    phone: "+8801711111111",
    roles: ["buyer", "seller", "business"],
    seller: {
      type: "business",
      shopName: "Purrfect Pet Shop",
      slug: "purrfect-pet-shop",
      bio: "Dhanmondi's favourite cat shop since 2018. Genuine imported food, litter and accessories. Home delivery across Dhaka.",
      tradeLicenseUrl: img("1589924691995-400dc9ecc119"),
      verificationStatus: "approved",
      verifiedAt: new Date(),
    },
  });
  const nusrat = await upsertUser({
    name: "Nusrat Jahan",
    username: "nusrat",
    email: "nusrat@meow.com.bd",
    phone: "+8801722222222",
    roles: ["buyer", "seller"],
    seller: { type: "individual", nidUrl: img("1514888286974-6c03e2ca1dba"), verificationStatus: "approved", verifiedAt: new Date() },
  });
  const rescue = await upsertUser({
    name: "Dhaka Cat Rescue",
    username: "dhakacatrescue",
    email: "rescue@meow.com.bd",
    phone: "+8801733333333",
    roles: ["buyer", "seller", "shelter"],
    seller: {
      type: "shelter",
      shopName: "Dhaka Cat Rescue",
      slug: "dhaka-cat-rescue",
      bio: "Volunteer-run rescue in Mirpur. All our cats are vet-checked, dewormed and vaccinated before adoption.",
      orgProofUrl: img("1529778873920-4da4926a72c2"),
      verificationStatus: "approved",
      verifiedAt: new Date(),
    },
  });
  const tanvir = await upsertUser({ name: "Tanvir Ahmed", username: "tanvir", email: "tanvir@meow.com.bd", phone: "+8801744444444", roles: ["buyer", "seller"] });
  console.log("✓ users");

  if ((await db.listing.count()) > 0) {
    console.log("Listings already exist — skipping demo listings. Use --reset to start over.");
    return finish(admin.email);
  }

  const cats = await db.category.findMany();
  const catId = (s: string) => {
    const c = cats.find((x) => x.slug === s);
    if (!c) throw new Error(`Missing category ${s}`);
    return c.id;
  };
  const locs = await db.location.findMany();
  const loc = (district: string, area?: string) => locs.find((l) => l.district === district && (area ? l.area === area : !l.area))!.id;

  type Demo = {
    seller: string;
    category: string;
    type: "cat" | "adoption" | "supply";
    title: string;
    description: string;
    price: number;
    location: string;
    images: string[];
    condition?: "new" | "used";
    stock?: number;
    negotiable?: boolean;
    featured?: boolean;
    attributes?: Record<string, unknown>;
    cat?: Omit<Prisma.CatDetailsUncheckedCreateInput, "listingId">;
  };

  const nextYear = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);
  const demos: Demo[] = [
    // Cats for sale
    {
      seller: nusrat.id, category: "cats-persian", type: "cat", featured: true,
      title: "White Persian kitten, 3 months, fully vaccinated",
      description: "Sweet, calm white Persian girl. Litter trained, eats Royal Canin kitten dry food. Comes with her vaccine card and a small bag of food. Parents can be seen at home.",
      price: 18000, negotiable: true, location: loc("Dhaka", "Dhanmondi"),
      images: [img("1561948955-570b270e7c36")],
      cat: { breed: "Persian", ageMonths: 3, gender: "female", color: "White", vaccinated: true, vaccineNote: "Tricat dose 1 & 2 done", neutered: false, healthNote: "Dewormed twice, vet checked last week. Healthy and active." },
    },
    {
      seller: nusrat.id, category: "cats-maine-coon", type: "cat", featured: true,
      title: "Ginger Maine Coon mix boy, very friendly",
      description: "Big fluffy ginger boy who loves people and gets along with other cats. Rehoming because we are moving abroad.",
      price: 25000, location: loc("Dhaka", "Gulshan"),
      images: [img("1573865526739-10659fec78a5")],
      cat: { breed: "Maine Coon", ageMonths: 14, gender: "male", color: "Ginger", vaccinated: true, vaccineNote: "Tricat + Rabies (annual) up to date", neutered: true, healthNote: "Neutered, microchipped, no health issues." },
    },
    {
      seller: nusrat.id, category: "cats-british-shorthair", type: "cat",
      title: "British Shorthair golden kitten",
      description: "Playful golden BSH kitten, round face, very social. Eats wet and dry food.",
      price: 30000, negotiable: true, location: loc("Chattogram"),
      images: [img("1592194996308-7b43878e84a6"), img("1548247416-ec66f4900b2e")],
      cat: { breed: "British Shorthair", ageMonths: 4, gender: "male", color: "Golden", vaccinated: true, vaccineNote: "First dose done", neutered: false, healthNote: "Healthy, dewormed, vet check done at 10 weeks." },
    },
    {
      seller: nusrat.id, category: "cats-bengal", type: "cat",
      title: "Bengal-mix tabby, 8 months, active and curious",
      description: "Energetic tabby with lovely markings. Needs an active home with toys and space to climb.",
      price: 12000, location: loc("Dhaka", "Uttara"),
      images: [img("1574158622682-e40e69881006")],
      cat: { breed: "Bengal", ageMonths: 8, gender: "female", color: "Brown tabby", vaccinated: true, neutered: false, healthNote: "Vaccinated and dewormed. Eats well." },
    },
    // Adoption
    {
      seller: rescue.id, category: "adoption-kitten", type: "adoption", featured: true,
      title: "Tabby kitten 'Mishti' needs a forever home",
      description: "Rescued from a drain in Mirpur at 3 weeks old, now healthy and playful. Looking for an indoor home with window nets.",
      price: 0, location: loc("Dhaka", "Mirpur"),
      images: [img("1529778873920-4da4926a72c2"), img("1615789591457-74a63395c990")],
      cat: { breed: "Local (Deshi)", ageMonths: 3, gender: "female", color: "Brown tabby", vaccinated: true, vaccineNote: "First dose done; second due next month", neutered: false, healthNote: "Dewormed, flea-treated, vet-checked.", adoptionFee: 500 },
    },
    {
      seller: rescue.id, category: "adoption-adult", type: "adoption",
      title: "Lazy orange boy 'Kamla' — couch potato",
      description: "Kamla is 2 years old, neutered, and loves naps in the sun. Good with children.",
      price: 0, location: loc("Dhaka", "Mohammadpur"),
      images: [img("1511044568932-338cba0ad803")],
      cat: { breed: "Local (Deshi)", ageMonths: 24, gender: "male", color: "Orange", vaccinated: true, vaccineNote: "Tricat + Rabies", neutered: true, healthNote: "Healthy. Neutered in March.", adoptionFee: 0 },
    },
    {
      seller: tanvir.id, category: "adoption-senior", type: "adoption",
      title: "Senior gentle cat 'Bhola' looking for a quiet home",
      description: "Bhola is 9 years old and very gentle. Family is relocating and cannot take him. Free to a loving home.",
      price: 0, location: loc("Sylhet"),
      images: [img("1519052537078-e6302a4968d4")],
      cat: { breed: "Local (Deshi)", ageMonths: 108, gender: "male", color: "Orange", vaccinated: true, neutered: true, healthNote: "Slight tooth wear, otherwise healthy. Annual vet visit done.", adoptionFee: 0 },
    },
    {
      seller: rescue.id, category: "adoption-adult", type: "adoption",
      title: "Black & white 'Panda' — affectionate lap cat",
      description: "Panda follows you around the house and loves chin scratches. Litter trained.",
      price: 0, location: loc("Dhaka", "Badda"),
      images: [img("1514888286974-6c03e2ca1dba")],
      cat: { breed: "Mixed", ageMonths: 18, gender: "female", color: "Black & white", vaccinated: true, neutered: true, healthNote: "Spayed, vaccinated, dewormed.", adoptionFee: 800 },
    },
    // Supplies — business (new)
    {
      seller: shop.id, category: "food-dry-food", type: "supply", condition: "new", stock: 40, featured: true,
      title: "Royal Canin Kitten dry food 2kg",
      description: "Genuine imported Royal Canin Kitten formula for kittens 4–12 months. Sealed bag with batch number.",
      price: 3450, location: loc("Dhaka", "Dhanmondi"),
      images: [img("1589924691995-400dc9ecc119")],
      attributes: { brand: "Royal Canin", expiryDate: nextYear },
    },
    {
      seller: shop.id, category: "food-treats", type: "supply", condition: "new", stock: 100,
      title: "Creamy lickable cat treats — 20 pack",
      description: "Tuna and chicken flavoured lickable treats. Great for bonding and giving medicine.",
      price: 650, location: loc("Dhaka", "Dhanmondi"),
      images: [img("1543852786-1cf6624b9987")],
      attributes: { brand: "Ciao", expiryDate: nextYear },
    },
    {
      seller: shop.id, category: "toys-scratchers", type: "supply", condition: "new", stock: 15,
      title: "Sisal scratching post with feather toy",
      description: "60cm sturdy sisal post with a heavy base. Saves your sofa!",
      price: 1250, location: loc("Dhaka", "Dhanmondi"),
      images: [img("1545249390-6bdfa286032f")],
      attributes: { brand: "Meowtopia" },
    },
    {
      seller: shop.id, category: "accessories-collars", type: "supply", condition: "new", stock: 30,
      title: "Breakaway collar with bell — adjustable",
      description: "Safety breakaway buckle, soft nylon, fits 20–30cm necks. Assorted colours.",
      price: 350, location: loc("Dhaka", "Dhanmondi"),
      images: [img("1583083527882-4bee9aba2eea")],
      attributes: { brand: "PawPlay" },
    },
    {
      seller: shop.id, category: "health-flea-tick", type: "supply", condition: "new", stock: 25,
      title: "Flea & tick spot-on for cats (3 pipettes)",
      description: "Vet-recommended monthly spot-on treatment for cats over 8 weeks. Original with hologram.",
      price: 1550, location: loc("Dhaka", "Dhanmondi"),
      images: [img("1596854407944-bf87f6fdd49e")],
      attributes: { brand: "Frontline", expiryDate: nextYear },
    },
    // Supplies — individual (used)
    {
      seller: tanvir.id, category: "furniture-cat-trees", type: "supply", condition: "used", negotiable: true,
      title: "Used 3-level cat tree, good condition",
      description: "Our cats outgrew it. Sisal slightly worn on one post, otherwise sturdy. Pickup from Banani.",
      price: 2500, location: loc("Dhaka", "Banani"),
      images: [img("1518791841217-8f162f1e1131"), img("1495360010541-f48722b34f7d"), img("1608848461950-0fe51dfc41cb")],
      attributes: { conditionNote: "1 year old, minor wear on sisal" },
    },
    {
      seller: tanvir.id, category: "travel-carriers", type: "supply", condition: "used", negotiable: true,
      title: "Hard-shell cat carrier (medium)",
      description: "Airline-style carrier, used twice for vet visits. Clean, with metal door.",
      price: 900, location: loc("Dhaka", "Banani"),
      images: [img("1568043210943-0e8aac4b9734"), img("1526336024174-e58f5cdd8e13"), img("1596854407944-bf87f6fdd49e")],
      attributes: { conditionNote: "Like new" },
    },
    {
      seller: nusrat.id, category: "litter-litter-box", type: "supply", condition: "used",
      title: "Covered litter box with scoop",
      description: "Large hooded litter box, washed and sanitised. Selling because we switched to an automatic one.",
      price: 700, location: loc("Dhaka", "Dhanmondi"),
      images: [img("1574158622682-e40e69881006"), img("1592194996308-7b43878e84a6"), img("1561948955-570b270e7c36")],
      attributes: { conditionNote: "6 months old, cleaned" },
    },
  ];

  for (const d of demos) {
    const s = `${slug(d.title).slice(0, 50)}-${Math.random().toString(36).slice(2, 7)}`;
    await db.listing.create({
      data: {
        sellerId: d.seller,
        categoryId: catId(d.category),
        type: d.type,
        condition: d.condition ?? null,
        title: d.title,
        slug: s,
        description: d.description,
        price: d.price,
        isNegotiable: d.negotiable ?? false,
        stock: d.stock ?? 1,
        status: "active",
        locationId: d.location,
        attributes: (d.attributes ?? (d.cat ? { breed: d.cat.breed, ageMonths: d.cat.ageMonths } : {})) as Prisma.InputJsonObject,
        isFeatured: d.featured ?? false,
        viewCount: Math.floor(Math.random() * 300),
        publishedAt: new Date(),
        catDetails: d.cat ? { create: d.cat } : undefined,
        images: { create: d.images.map((url, i) => ({ url, position: i, isCover: i === 0 })) },
      },
    });
  }
  console.log(`✓ ${demos.length} demo listings`);

  finish(admin.email);
}

function finish(adminEmail: string) {
  console.log(`
Done! Demo accounts (password: ${DEMO_PASSWORD})
  Admin:            ${adminEmail}
  Business seller:  shop@meow.com.bd
  Verified seller:  nusrat@meow.com.bd
  Shelter:          rescue@meow.com.bd
  Individual:       tanvir@meow.com.bd
Change or delete these before going to production.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
