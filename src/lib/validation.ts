import { z } from "zod";
import { RULES } from "./constants";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const imageSchema = z.object({
  url: z.string().url(),
  publicId: z.string().optional().nullable(),
  hash: z.string().optional().nullable(),
});

const baseListing = {
  categoryId: z.string().uuid("Choose a category"),
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().trim().min(20, "Add a few more details (20+ characters)").max(5000),
  locationId: z.string().uuid("Choose a location"),
  videoUrl: z
    .string()
    .trim()
    .url("Video link must be a valid URL")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  images: z.array(imageSchema).max(RULES.maxPhotos, `Maximum ${RULES.maxPhotos} photos`),
  asDraft: z.boolean().optional(),
};

const catFields = {
  breed: z.string().trim().min(2, "Breed is required"),
  ageMonths: z.coerce
    .number()
    .int()
    .min(RULES.minCatAgeMonths, `Kittens must be at least ${RULES.minCatAgeWeeks} weeks old`)
    .max(300),
  gender: z.enum(["male", "female"]),
  color: z.string().trim().max(40).optional(),
  vaccinated: z.boolean(),
  vaccineNote: z.string().trim().max(500).optional(),
  neutered: z.boolean(),
  healthNote: z.string().trim().min(10, "Health information is required (10+ characters)").max(1000),
};

export const catListingSchema = z.object({
  type: z.literal("cat"),
  ...baseListing,
  ...catFields,
  price: z.coerce.number().int().min(1, "Price is required").max(1_000_000),
  isNegotiable: z.boolean().default(false),
});

export const adoptionListingSchema = z.object({
  type: z.literal("adoption"),
  ...baseListing,
  ...catFields,
  adoptionFee: z.coerce
    .number()
    .int()
    .min(0)
    .max(RULES.maxAdoptionFee, `Rehoming fee is capped at ৳${RULES.maxAdoptionFee}`)
    .default(0),
});

export const supplyListingSchema = z.object({
  type: z.literal("supply"),
  ...baseListing,
  condition: z.enum(["new", "used"]),
  brand: z.string().trim().max(60).optional(),
  price: z.coerce.number().int().min(1, "Price is required").max(1_000_000),
  isNegotiable: z.boolean().default(false),
  stock: z.coerce.number().int().min(1).max(10_000).default(1),
  expiryDate: z
    .string()
    .optional()
    .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Invalid expiry date"),
  conditionNote: z.string().trim().max(500).optional(),
  isSealed: z.boolean().optional(),
});

export const listingSchema = z.discriminatedUnion("type", [
  catListingSchema,
  adoptionListingSchema,
  supplyListingSchema,
]);

export type ListingInput = z.infer<typeof listingSchema>;

export const adoptionRequestSchema = z.object({
  listingId: z.string().uuid(),
  message: z.string().trim().min(20, "Tell the owner a bit more (20+ characters)").max(2000),
  homeType: z.string().trim().min(2, "Home type is required").max(200),
  otherPets: z.string().trim().max(500).default(""),
  experience: z.string().trim().min(5, "Share your experience with cats").max(1000),
  phone: z.string().trim().max(20).optional(),
});

export const reportSchema = z.object({
  targetType: z.enum(["listing", "user"]),
  targetId: z.string().uuid(),
  reason: z.string().min(2).max(100),
  details: z.string().trim().max(1000).optional(),
});

export const orderSchema = z.object({
  listingId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(100),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(10).max(20),
  line: z.string().trim().min(5, "Enter a full delivery address").max(300),
  district: z.string().trim().min(2).max(60),
  note: z.string().trim().max(300).optional(),
});

export const reviewSchema = z.object({
  orderId: z.string().uuid().optional(),
  adoptionRequestId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
});

export const sellerVerificationSchema = z.object({
  type: z.enum(["individual", "business", "shelter"]),
  shopName: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(1000).optional(),
  documentUrl: z.string().url("Upload your verification document"),
});
