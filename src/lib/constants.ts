export const SITE = {
  name: "Meow",
  tagline: "Bangladesh's marketplace for cats & everything they need",
  currency: "BDT",
};

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
