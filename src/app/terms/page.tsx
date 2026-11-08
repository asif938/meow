import type { Metadata } from "next";
import Link from "next/link";
import { ProsePage } from "@/components/prose-page";

export const metadata: Metadata = { title: "Terms of use" };

export default function TermsPage() {
  return (
    <ProsePage title="Terms of use" updated="October 2026">
      <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        Template — have this reviewed by a legal advisor familiar with Bangladesh&apos;s animal welfare law and e-commerce rules before launch.
      </p>
      <h2>1. The service</h2>
      <p>
        Meow is an online marketplace that connects buyers, adopters, and sellers of cats and cat supplies. Unless stated otherwise, Meow is not a
        party to transactions between users.
      </p>
      <h2>2. Accounts</h2>
      <ul>
        <li>You must provide accurate information and keep your login secure.</li>
        <li>Posting requires a verified phone number. Selling cats requires ID verification.</li>
        <li>New products and health/medicine items may only be listed by approved business sellers.</li>
      </ul>
      <h2>3. Listings</h2>
      <ul>
        <li>Listings must be accurate, use your own photos, and follow our <Link href="/safety#prohibited">prohibited items list</Link>.</li>
        <li>Cat listings must include age, health and vaccine information. Minimum age is 8 weeks.</li>
        <li>Adoption listings may not carry a sale price.</li>
        <li>We may review, edit, reject, or remove listings and suspend accounts that break these terms.</li>
      </ul>
      <h2>4. Payments and delivery</h2>
      <p>
        During the initial phase, payments are cash on delivery or arranged directly between users. Sellers are responsible for delivery unless
        otherwise stated.
      </p>
      <h2>5. Reviews</h2>
      <p>Reviews can only be left after a completed order or adoption and must be honest and respectful.</p>
      <h2>6. Liability</h2>
      <p>
        Meow provides the platform &ldquo;as is&rdquo;. We are not liable for the condition of animals or items, or for disputes between users, to
        the extent permitted by law.
      </p>
      <h2>7. Contact</h2>
      <p>Questions or appeals: support@meow.com.bd</p>
    </ProsePage>
  );
}
