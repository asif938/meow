import type { Metadata } from "next";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <ProsePage title="Privacy policy" updated="October 2026">
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Template — have this reviewed by a legal advisor before launch.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>Account details: name, email, phone number, and profile photo.</li>
        <li>Verification documents (NID, trade license, organisation proof) — visible only to Meow moderators.</li>
        <li>Listings, messages, adoption requests, orders, reviews and reports you create.</li>
        <li>Basic usage data such as listing views.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To run the marketplace: show listings, deliver messages, process orders and adoption requests.</li>
        <li>To keep users safe: verification, fraud and spam detection, moderation.</li>
        <li>To send transactional emails and SMS (OTP codes, order and request updates).</li>
      </ul>
      <h2>What we share</h2>
      <ul>
        <li>Your public profile and listings are visible to everyone.</li>
        <li>Your phone number is shared with an adopter only after you approve their request, and with a shop when you place an order.</li>
        <li>We use service providers for hosting (Vercel, Neon), images (Cloudinary), email and SMS.</li>
        <li>We never sell your personal data.</li>
      </ul>
      <h2>Your choices</h2>
      <p>You can edit your profile, delete listings, and request account deletion by contacting support@meow.com.bd.</p>
    </ProsePage>
  );
}
