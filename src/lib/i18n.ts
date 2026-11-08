import "server-only";
import { cookies } from "next/headers";

export const locales = ["en", "bn"] as const;
export type Locale = (typeof locales)[number];

const en = {
  "nav.cats": "Buy a cat",
  "nav.adopt": "Adopt",
  "nav.shop": "Shop supplies",
  "nav.sell": "Post an ad",
  "nav.messages": "Messages",
  "nav.dashboard": "Dashboard",
  "nav.account": "My account",
  "nav.admin": "Admin",
  "nav.login": "Log in",
  "nav.register": "Sign up",
  "nav.logout": "Log out",
  "search.placeholder": "Search Persian kittens, cat food, litter…",
  "search.button": "Search",
  "home.hero.title": "Find your purr-fect match",
  "home.hero.subtitle": "Buy, adopt and shop for cats across Bangladesh — from verified sellers and shelters.",
  "home.entry.cats": "Buy a cat",
  "home.entry.cats.desc": "Health & vaccine info on every listing",
  "home.entry.adopt": "Adopt",
  "home.entry.adopt.desc": "Give a rescued cat a forever home",
  "home.entry.shop": "Shop supplies",
  "home.entry.shop.desc": "Food, litter, toys — new & used",
  "home.featured": "Featured cats",
  "home.adoption": "Waiting for a home",
  "home.categories": "Shop by category",
  "home.new": "New arrivals",
  "common.viewAll": "View all",
  "common.verified": "Verified",
  "common.new": "New",
  "common.used": "Used",
  "common.negotiable": "Negotiable",
  "common.adoption": "Adoption",
  "common.free": "Free",
  "common.noResults": "No listings found. Try changing your filters.",
  "footer.about": "About",
  "footer.safety": "Safety tips",
  "footer.terms": "Terms",
  "footer.privacy": "Privacy",
} as const;

export type MessageKey = keyof typeof en;

const bn: Record<MessageKey, string> = {
  "nav.cats": "বিড়াল কিনুন",
  "nav.adopt": "দত্তক নিন",
  "nav.shop": "সামগ্রী কিনুন",
  "nav.sell": "বিজ্ঞাপন দিন",
  "nav.messages": "মেসেজ",
  "nav.dashboard": "ড্যাশবোর্ড",
  "nav.account": "আমার অ্যাকাউন্ট",
  "nav.admin": "অ্যাডমিন",
  "nav.login": "লগ ইন",
  "nav.register": "সাইন আপ",
  "nav.logout": "লগ আউট",
  "search.placeholder": "পার্সিয়ান বিড়াল, ক্যাট ফুড, লিটার খুঁজুন…",
  "search.button": "খুঁজুন",
  "home.hero.title": "আপনার প্রিয় বিড়ালটি খুঁজে নিন",
  "home.hero.subtitle": "সারা বাংলাদেশে যাচাইকৃত বিক্রেতা ও শেল্টার থেকে বিড়াল কিনুন, দত্তক নিন, প্রয়োজনীয় সামগ্রী কিনুন।",
  "home.entry.cats": "বিড়াল কিনুন",
  "home.entry.cats.desc": "প্রতিটি বিজ্ঞাপনে স্বাস্থ্য ও টিকার তথ্য",
  "home.entry.adopt": "দত্তক নিন",
  "home.entry.adopt.desc": "উদ্ধারকৃত বিড়ালকে স্থায়ী ঘর দিন",
  "home.entry.shop": "সামগ্রী কিনুন",
  "home.entry.shop.desc": "খাবার, লিটার, খেলনা — নতুন ও পুরাতন",
  "home.featured": "বাছাইকৃত বিড়াল",
  "home.adoption": "ঘরের অপেক্ষায়",
  "home.categories": "ক্যাটাগরি অনুযায়ী কিনুন",
  "home.new": "নতুন বিজ্ঞাপন",
  "common.viewAll": "সব দেখুন",
  "common.verified": "যাচাইকৃত",
  "common.new": "নতুন",
  "common.used": "পুরাতন",
  "common.negotiable": "আলোচনা সাপেক্ষ",
  "common.adoption": "দত্তক",
  "common.free": "বিনামূল্যে",
  "common.noResults": "কোনো বিজ্ঞাপন পাওয়া যায়নি। ফিল্টার পরিবর্তন করে দেখুন।",
  "footer.about": "আমাদের সম্পর্কে",
  "footer.safety": "নিরাপত্তা টিপস",
  "footer.terms": "শর্তাবলী",
  "footer.privacy": "গোপনীয়তা",
};

const dictionaries = { en, bn } as const;

export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get("locale")?.value;
  return value === "bn" ? "bn" : "en";
}

export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale];
  return Object.assign((key: MessageKey) => dict[key] ?? en[key], { locale });
}

export type T = Awaited<ReturnType<typeof getT>>;
