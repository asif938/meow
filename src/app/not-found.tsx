import Link from "next/link";
import { Cat } from "lucide-react";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-24 text-center">
      <Cat className="h-16 w-16 text-brand-300" />
      <h1 className="mt-4 font-display text-3xl font-bold">This page wandered off</h1>
      <p className="mt-2 text-muted">Like cats do. The listing may have been sold, adopted, or removed.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className={buttonClass()}>Go home</Link>
        <Link href="/search" className={buttonClass("outline")}>Browse listings</Link>
      </div>
    </div>
  );
}
