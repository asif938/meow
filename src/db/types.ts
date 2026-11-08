// Type-only re-exports, safe to import from client components (nothing here reaches the bundle).
export type {
  User,
  Listing,
  Category,
  Location,
  CatDetails,
  Role,
  ListingType,
  ListingStatus,
  ListingCondition,
  CatGender,
  SellerType,
  VerificationStatus,
  RequestStatus,
  OrderStatus,
  UserStatus,
  ReportStatus,
} from "../generated/prisma/client";

/** Shape of `AdoptionRequest.homeInfo` (stored as JSON). */
export type HomeInfo = { homeType: string; otherPets: string; experience: string; phone?: string };

/** Shape of `Order.address` (stored as JSON). */
export type OrderAddress = { name: string; phone: string; line: string; district: string; note?: string };

/** Shape of `Listing.attributes` (stored as JSON). */
export type ListingAttributes = {
  brand?: string;
  expiryDate?: string;
  conditionNote?: string;
  isSealed?: boolean;
  [key: string]: unknown;
};
