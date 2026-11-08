import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { googleEnabled } from "@/lib/auth";
import { Alert } from "@/components/ui";
import { LoginForm } from "./login-form";
import { GoogleButton } from "../google-button";

export const metadata: Metadata = { title: "Log in" };

type Props = { searchParams: Promise<{ next?: string; error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, error } = await searchParams;
  if (await getCurrentUser()) redirect(next?.startsWith("/") ? next : "/");

  return (
    <>
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-muted">Log in to chat with sellers, save favourites and post ads.</p>
      {error === "banned" && <Alert tone="red" className="mt-4">This account has been suspended.</Alert>}
      {error && error !== "banned" && <Alert tone="red" className="mt-4">Sign-in failed. Please try again.</Alert>}
      <div className="mt-6 space-y-4">
        {googleEnabled && (
          <>
            <GoogleButton next={next} />
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
            </div>
          </>
        )}
        <LoginForm next={next} />
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        New to Meow?{" "}
        <Link href={`/register${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
