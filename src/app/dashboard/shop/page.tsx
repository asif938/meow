import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Clock, XCircle } from "lucide-react";
import { requireUser } from "@/lib/session";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import { Alert, Card } from "@/components/ui";
import { LazyVerificationForm } from "./lazy-verification-form";

export const metadata: Metadata = { title: "Shop & verification", robots: { index: false } };

export default async function ShopSettingsPage() {
  const user = await requireUser("/dashboard/shop");
  const sp = user.sellerProfile;
  const status = sp?.verificationStatus ?? "none";

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {status === "approved" && (
          <Alert tone="green" className="flex items-start gap-2">
            <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <span>
              You&apos;re a <strong>verified {sp?.type === "business" ? "business seller" : sp?.type === "shelter" ? "shelter / rescuer" : "seller"}</strong>.
              The verified badge now shows on your profile and listings.
              {sp?.type === "business" && " You can list new products and receive COD orders."}
            </span>
          </Alert>
        )}
        {status === "pending" && (
          <Alert tone="blue" className="flex items-start gap-2">
            <Clock className="mt-0.5 h-5 w-5 shrink-0" /> Your application is under review. We&apos;ll notify you once it&apos;s done.
          </Alert>
        )}
        {status === "rejected" && (
          <Alert tone="red" className="flex items-start gap-2">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>Your application was not approved{sp?.rejectionReason ? `: ${sp.rejectionReason}` : "."} You can fix the issue and apply again.</span>
          </Alert>
        )}
        {!user.isPhoneVerified && (
          <Alert tone="amber">
            Verify your phone first. <Link href="/verify?next=/dashboard/shop" className="font-semibold underline">Verify phone</Link>
          </Alert>
        )}

        {status !== "pending" && (
          <Card className="p-5 sm:p-6">
            <h2 className="mb-1 font-display text-lg font-bold">{status === "approved" ? "Update verification" : "Get verified"}</h2>
            <p className="mb-5 text-sm text-muted">Documents are only visible to Meow moderators.</p>
            <LazyVerificationForm
              uploadsEnabled={cloudinaryEnabled}
              defaults={{ type: sp?.type ?? "individual", shopName: sp?.shopName ?? "", bio: sp?.bio ?? "" }}
            />
          </Card>
        )}
      </div>

      <Card className="h-fit space-y-4 p-5 text-sm">
        <h3 className="font-semibold">Verification levels</h3>
        <div>
          <p className="font-medium">Individual seller</p>
          <p className="text-muted">Phone OTP + NID photo. Unlocks selling cats.</p>
        </div>
        <div>
          <p className="font-medium">Business seller</p>
          <p className="text-muted">Trade license or shop proof. Unlocks new products, Health & medicine, shop page and COD orders.</p>
        </div>
        <div>
          <p className="font-medium">Shelter / rescuer</p>
          <p className="text-muted">Organisation proof. Verified badge on adoption listings and no listing limits.</p>
        </div>
      </Card>
    </div>
  );
}
