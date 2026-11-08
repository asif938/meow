import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import { getWizardData } from "@/lib/wizard-data";
import { ListingWizard } from "@/components/listing-wizard";
import { PageHeader } from "@/components/ui";

export const metadata: Metadata = { title: "Post an ad", robots: { index: false } };

export default async function SellPage() {
  const user = await requireUser("/sell/new");
  const { categories, locations } = await getWizardData();

  return (
    <div className="container-page max-w-3xl py-8">
      <PageHeader title="Post an ad" description="It takes about 2 minutes. Posting is free." />
      <ListingWizard
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
