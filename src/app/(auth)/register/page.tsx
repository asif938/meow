import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { googleEnabled } from "@/lib/auth";
import { RegisterForm } from "./register-form";
import { GoogleButton } from "../google-button";

export const metadata: Metadata = { title: "Create account" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function RegisterPage({ searchParams }: Props) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect("/");

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Join Meow</h1>
      <p className="mt-1 text-sm text-muted">One account to buy, adopt and sell. It&apos;s free.</p>
      <div className="mt-6 space-y-4">
        {googleEnabled && (
          <>
            <GoogleButton next={next} />
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}
        <RegisterForm />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:underline">Log in</Link>
      </p>
      <p className="mt-4 text-center text-xs text-muted">
        By signing up you agree to our <Link href="/terms" className="underline">Terms</Link> and{" "}
        <Link href="/privacy" className="underline">Privacy Policy</Link>.
      </p>
    </>
  );
}
