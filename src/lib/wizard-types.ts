import type { UploadedImage } from "@/components/image-uploader";

export type WizardCategory = {
  id: string;
  parentId: string | null;
  name: string;
  listingType: "cat" | "supply" | "adoption";
  allowedConditions: ("new" | "used")[];
  businessOnly: boolean;
  requiresExpiry: boolean;
};
export type WizardLocation = { id: string; division: string; district: string; area: string | null };

export type WizardValues = {
  type: "cat" | "supply" | "adoption" | "";
  condition: "new" | "used" | "";
  categoryId: string;
  title: string;
  description: string;
  breed: string;
  ageMonths: string;
  gender: "male" | "female" | "";
  color: string;
  vaccinated: boolean;
  vaccineNote: string;
  neutered: boolean;
  healthNote: string;
  brand: string;
  expiryDate: string;
  conditionNote: string;
  isSealed: boolean;
  stock: string;
  price: string;
  isNegotiable: boolean;
  adoptionFee: string;
  locationId: string;
  videoUrl: string;
  images: UploadedImage[];
};

export const emptyWizard: WizardValues = {
  type: "",
  condition: "",
  categoryId: "",
  title: "",
  description: "",
  breed: "",
  ageMonths: "",
  gender: "",
  color: "",
  vaccinated: false,
  vaccineNote: "",
  neutered: false,
  healthNote: "",
  brand: "",
  expiryDate: "",
  conditionNote: "",
  isSealed: false,
  stock: "1",
  price: "",
  isNegotiable: false,
  adoptionFee: "0",
  locationId: "",
  videoUrl: "",
  images: [],
};
