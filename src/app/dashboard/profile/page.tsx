import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import { Card, PageHeader } from "@/components/ui";
import { AvatarUploader } from "./avatar-uploader";
import { PasswordForm, ProfileForm } from "./profile-forms";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function ProfilePage() {
  const user = await requireUser("/dashboard/profile");
  const pw = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description={user.email} />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-h3 mb-4">Profile photo</h2>
            <AvatarUploader name={user.name} avatar={user.avatar} uploadsEnabled={cloudinaryEnabled} />
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="text-h3 mb-4">Your details</h2>
            <ProfileForm
              name={user.name}
              bio={user.sellerProfile?.bio ?? ""}
              shopName={user.sellerProfile?.shopName ?? ""}
              hasShop={Boolean(user.sellerProfile)}
            />
          </Card>
        </div>
        <div className="space-y-6">
          <Card className="p-5 sm:p-6">
            <h2 className="text-h3 mb-4">Change password</h2>
            <PasswordForm hasPassword={Boolean(pw?.passwordHash)} />
          </Card>
          <Card className="space-y-3 p-5 text-sm sm:p-6">
            <h2 className="text-h3 flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Verification</h2>
            <p className="flex justify-between gap-3">
              <span>Phone</span>
              {user.isPhoneVerified ? (
                <span className="text-emerald-700">{user.phone} ✓</span>
              ) : (
                <Link href="/verify?next=/dashboard/profile" className="font-semibold text-brand-600">Verify</Link>
              )}
            </p>
            <p className="flex justify-between gap-3">
              <span>Seller ID</span>
              {user.sellerProfile?.verificationStatus === "approved" ? (
                <span className="text-emerald-700">Verified ✓</span>
              ) : user.sellerProfile?.verificationStatus === "pending" ? (
                <span className="text-muted">In review</span>
              ) : (
                <Link href="/dashboard/shop" className="font-semibold text-brand-600">Get verified</Link>
              )}
            </p>
            <p className="flex justify-between gap-3">
              <span>Public profile</span>
              <Link href={`/seller/${user.username}`} className="text-brand-600">@{user.username}</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
