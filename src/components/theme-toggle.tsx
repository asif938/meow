"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

/** Light/dark switch. Icons swap with CSS so server and client markup always match. */
export function ThemeToggle({ className }: { className?: string }) {
  const toggle = () => {
    const dark = document.documentElement.classList.toggle("dark");
    try {
      localStorage.setItem("theme", dark ? "dark" : "light");
    } catch {
      // Storage blocked: the choice simply will not persist.
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      className={cn("inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-ink hover:bg-brand-50", className)}
    >
      <Sun className="hidden h-5 w-5 dark:block" aria-hidden />
      <Moon className="h-5 w-5 dark:hidden" aria-hidden />
    </button>
  );
}
