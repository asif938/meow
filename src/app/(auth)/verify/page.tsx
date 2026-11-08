import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { Alert } from "@/components/ui";
import { VerifyPhoneForm } from "./verify-form";

export const metadata: Metadata = { title: "Verify your phone" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function VerifyPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const user = await requireUser("/verify");

  return (
    <>
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-600">
        <ShieldCheck className="h-6 w-6" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold">Verify your phone</h1>
      <p className="mt-1 text-sm text-muted">
        A verified phone number is required to post listings. We never show your number publicly unless you approve an adoption request.
      </p>
      {user.isPhoneVerified ? (
        <Alert tone="green" className="mt-6">
          Your phone {user.phone} is verified. <Link href={next ?? "/sell/new"} className="font-semibold underline">Continue</Link>
        </Alert>
      ) : (
        <div className="mt-6">
          <VerifyPhoneForm next={next} />
        </div>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/" className="text-muted hover:underline">Skip for now</Link>
      </p>
    </>
  );
}
