/** Serializable, pre-formatted row shapes passed from Server Components to the client islands. */
export type ListingStatus = "draft" | "pending" | "active" | "sold" | "adopted" | "rejected";

export type ListingRowData = {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: ListingStatus;
  condition: string | null;
  stock: number;
  viewCount: number;
  /** Already formatted on the server ("৳1,200"); null for adoption listings. */
  priceLabel: string | null;
  ageLabel: string;
  createdAt: string;
  /** Already run through the Cloudinary transform on the server. */
  cover: string | null;
  rejectionReason: string | null;
};

export type UserRowData = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string | null;
  roles: string;
  seller: string;
  joined: string;
  status: "active" | "banned";
  banReason: string | null;
};
