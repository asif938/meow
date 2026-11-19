export const SITE = {
  name: "Meow",
  tagline: "Bangladesh's marketplace for cats & everything they need",
  currency: "BDT",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "support@meow.com.bd",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE ?? "+880 1700-000000",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS ?? "Dhaka, Bangladesh",
  /** Point these at your real pages with NEXT_PUBLIC_*_URL env vars. */
  social: {
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "https://www.facebook.com/",
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "https://www.youtube.com/",
  },
  /** Demo-login buttons on /login. Turn off in real production with NEXT_PUBLIC_DEMO_LOGIN=false. */
  demoLogin: process.env.NEXT_PUBLIC_DEMO_LOGIN !== "false",
};

export const DEMO_ACCOUNTS = [
  { label: "Demo user", email: "nusrat@meow.com.bd", password: "meow12345" },
  { label: "Demo admin", email: "admin@meow.com.bd", password: "meow12345" },
] as const;

/** Animal-welfare and anti-abuse rules (see Trust & Safety plan). */
export const RULES = {
  minCatAgeWeeks: 8,
  minCatAgeMonths: 2,
  maxActiveCatListingsPerSeller: 5,
  maxAdoptionFee: 2000,
  minSupplyPhotos: 3,
  minCatPhotos: 1,
  maxPhotos: 10,
  listingsPerHour: 5,
  messagesPerMinute: 20,
  reportsPerDay: 10,
};

export const CAT_BREEDS = [
  "Persian",
  "Siamese",
  "Maine Coon",
  "Bengal",
  "British Shorthair",
  "Ragdoll",
  "Scottish Fold",
  "Exotic Shorthair",
  "Local (Deshi)",
  "Mixed",
];

export const REPORT_REASONS = [
  "Scam or fraud",
  "Animal welfare concern",
  "Fake or misleading listing",
  "Prohibited / expired item",
  "Selling a cat as 'adoption'",
  "Duplicate or spam",
  "Abusive behaviour",
  "Other",
];

export const DIVISIONS: Record<string, string[]> = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Narsingdi", "Manikganj", "Munshiganj", "Tangail", "Faridpur", "Kishoreganj"],
  Chattogram: ["Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Noakhali", "Brahmanbaria", "Chandpur", "Rangamati"],
  Rajshahi: ["Rajshahi", "Bogura", "Pabna", "Natore", "Naogaon", "Sirajganj"],
  Khulna: ["Khulna", "Jashore", "Kushtia", "Satkhira", "Bagerhat"],
  Barishal: ["Barishal", "Patuakhali", "Bhola", "Pirojpur"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Rangpur: ["Rangpur", "Dinajpur", "Kurigram", "Gaibandha", "Thakurgaon"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

export const DHAKA_AREAS = [
  "Dhanmondi",
  "Gulshan",
  "Banani",
  "Mirpur",
  "Uttara",
  "Mohammadpur",
  "Bashundhara",
  "Badda",
  "Motijheel",
  "Old Dhaka",
];

export const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "popular", label: "Most viewed" },
] as const;
