import "server-only";
import type { ListingRowData, ListingStatus, UserRowData } from "./dashboard-types";

/**
 * Deterministic synthetic data for load-testing the dashboards with 1,000+ rows
 * WITHOUT writing to the real database.
 *
 * Opt-in only: requires PERF_DEMO=1 in the server env AND `?demo=<n>` in the URL.
 * Never enabled in a normal deployment.
 */
export function demoCount(raw: string | undefined, max = 20000) {
  if (process.env.PERF_DEMO !== "1" || !raw) return 0;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : 0;
}

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const NOUNS = ["Persian kitten", "Cat tree", "Scratching post", "Siamese cat", "Litter box", "Cat food 5kg", "Carrier bag", "Maine Coon", "Cat bed", "Feeding bowl", "Bengal kitten", "Collar & bell"];
const ADJ = ["Fluffy", "Premium", "Gently used", "Adorable", "Brand new", "Healthy", "Cozy", "Playful"];
const STATUSES: ListingStatus[] = ["active", "active", "active", "pending", "draft", "sold", "adopted", "rejected"];
const TYPES = ["cat", "product", "adoption", "product"];
const NF = new Intl.NumberFormat("en-BD");

export function demoListings(n: number): ListingRowData[] {
  const r = rng(42);
  return Array.from({ length: n }, (_, i) => {
    const type = TYPES[Math.floor(r() * TYPES.length)];
    const status = STATUSES[Math.floor(r() * STATUSES.length)];
    return {
      id: `demo-${i}`,
      slug: `demo-listing-${i}`,
      title: `${ADJ[Math.floor(r() * ADJ.length)]} ${NOUNS[Math.floor(r() * NOUNS.length)]} #${i + 1}`,
      type,
      status,
      condition: type === "adoption" ? null : r() > 0.5 ? "new" : "used",
      stock: Math.floor(r() * 20),
      viewCount: Math.floor(r() * r() * 5000),
      priceLabel: type === "adoption" ? null : `৳${NF.format(Math.floor(r() * 30000) + 200)}`,
      ageLabel: `${Math.floor(r() * 11) + 1}mo`,
      createdAt: new Date(Date.now() - i * 3_600_000).toISOString(),
      cover: null,
      rejectionReason: status === "rejected" ? "Photos are unclear" : null,
    };
  });
}

const FIRST = ["Nusrat", "Tanvir", "Rahim", "Karim", "Sadia", "Farhan", "Mim", "Arif", "Tasnim", "Rafi"];
const LAST = ["Ahmed", "Hossain", "Islam", "Khan", "Rahman", "Chowdhury", "Akter", "Uddin"];

export function demoUsers(n: number): UserRowData[] {
  const r = rng(7);
  return Array.from({ length: n }, (_, i) => {
    const name = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`;
    const username = `${name.toLowerCase().replace(/\s/g, "")}${i}`;
    const banned = r() > 0.95;
    const isSeller = r() > 0.6;
    return {
      id: `demo-user-${i}`,
      name,
      username,
      email: `${username}@example.com`,
      phone: r() > 0.3 ? `+8801${Math.floor(r() * 1e9).toString().padStart(9, "0")}` : null,
      roles: isSeller ? "buyer, seller" : "buyer",
      seller: isSeller ? `individual (${r() > 0.5 ? "approved" : "pending"})` : "—",
      joined: `${Math.floor(r() * 300) + 1}d ago`,
      status: banned ? "banned" : "active",
      banReason: banned ? "Spam listings" : null,
    };
  });
}
