import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import { getWizardData } from "@/lib/wizard-data";
import { ListingWizard } from "@/components/listing-wizard";
import { emptyWizard, type WizardValues } from "@/lib/wizard-types";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Edit listing", robots: { index: false } };

type Props = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: Props) {
  const { id } = await params;
  const user = await requireUser(`/dashboard/listings/${id}/edit`);
  const listing = await db.listing.findUnique({
    where: { id },
    include: { catDetails: true, images: { orderBy: { position: "asc" } } },
  });
  if (!listing || listing.sellerId !== user.id) notFound();

  const a = listing.attributes as { brand?: string; expiryDate?: string; conditionNote?: string; isSealed?: boolean };
  const cd = listing.catDetails;
  const initial: WizardValues = {
    ...emptyWizard,
    type: listing.type,
    condition: listing.condition ?? "",
    categoryId: listing.categoryId,
    title: listing.title,
    description: listing.description ?? "",
    breed: cd?.breed ?? "",
    ageMonths: cd ? String(cd.ageMonths) : "",
    gender: cd?.gender ?? "",
    color: cd?.color ?? "",
    vaccinated: cd?.vaccinated ?? false,
    vaccineNote: cd?.vaccineNote ?? "",
    neutered: cd?.neutered ?? false,
    healthNote: cd?.healthNote ?? "",
    brand: a.brand ?? "",
    expiryDate: a.expiryDate ?? "",
    conditionNote: a.conditionNote ?? "",
    isSealed: a.isSealed ?? false,
    stock: String(listing.stock),
    price: listing.price ? String(listing.price) : "",
    isNegotiable: listing.isNegotiable,
    adoptionFee: String(cd?.adoptionFee ?? 0),
    locationId: listing.locationId ?? "",
    videoUrl: listing.videoUrl ?? "",
    images: listing.images.map((i) => ({ url: i.url, publicId: i.publicId, hash: i.hash })),
  };
  const { categories, locations } = await getWizardData();

  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader title="Edit listing" description="Changes to content are re-checked before going live." />
      <ListingWizard
        listingId={listing.id}
        initial={initial}
        categories={categories}
        locations={locations}
        uploadsEnabled={cloudinaryEnabled}
        caps={{
          isBusiness: user.isBusiness || user.isAdmin,
          isVerifiedSeller: user.isVerifiedSeller || user.isAdmin,
          isPhoneVerified: user.isPhoneVerified || user.isAdmin,
        }}
      />
    </div>
  );
}
