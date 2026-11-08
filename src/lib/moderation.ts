/**
 * Lightweight automated checks. Anything that trips these goes to the admin
 * queue (status = pending) instead of being auto-published.
 */

const BANNED_KEYWORDS = [
  "expired",
  "fake",
  "replica",
  "copy product",
  "steroid",
  "poison",
  "fighting",
  "breeding mill",
  "wholesale kittens",
  "bulk kittens",
  "drug",
  "weapon",
];

export function findBannedWords(...texts: (string | null | undefined)[]) {
  const haystack = texts.filter(Boolean).join(" ").toLowerCase();
  return BANNED_KEYWORDS.filter((w) => haystack.includes(w));
}

// Bangladeshi mobile numbers (01XXXXXXXXX, +8801XXXXXXXXX) incl. Bangla digits & separators.
const PHONE_RE = /(\+?88)?\s*0?1[3-9](?:[\s-]?[0-9০-৯]){8}/;
const LINK_RE = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|bd|xyz|me|io)\b|wa\.me|t\.me|m\.me)/i;

/** Detects attempts to move the deal off-platform (phone numbers, links). */
export function containsContactInfo(text: string) {
  return PHONE_RE.test(text) || LINK_RE.test(text);
}

/** Normalises Bangladeshi phone numbers to +8801XXXXXXXXX. */
export function normalizeBdPhone(input: string) {
  const digits = input
    .replace(/[০-৯]/g, (d) => String("০১২৩৪৫৬৭৮৯".indexOf(d)))
    .replace(/\D/g, "");
  const local = digits.replace(/^(88)?0?/, "");
  if (!/^1[3-9]\d{8}$/.test(local)) return null;
  return `+880${local}`;
}
