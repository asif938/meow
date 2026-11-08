import Link from "next/link";
import { Cat } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-1.5" aria-label="Meow home">
      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-brand-500 text-white shadow-sm">
        <Cat className="h-5 w-5" aria-hidden />
      </span>
      <span className="font-display text-2xl font-extrabold tracking-tight text-ink">
        meow<span className="text-brand-500">.</span>
      </span>
    </Link>
  );
}
