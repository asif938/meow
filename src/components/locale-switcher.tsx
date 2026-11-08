import { Languages } from "lucide-react";
import { setLocaleAction } from "@/actions/locale";

export function LocaleSwitcher({ locale }: { locale: "en" | "bn" }) {
  const next = locale === "en" ? "bn" : "en";
  return (
    <form action={setLocaleAction}>
      <input type="hidden" name="locale" value={next} />
      <button
        className="inline-flex h-9 cursor-pointer items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-muted hover:bg-brand-50 hover:text-ink"
        aria-label={next === "bn" ? "বাংলায় দেখুন" : "View in English"}
      >
        <Languages className="h-4 w-4" />
        {next === "bn" ? "বাং" : "EN"}
      </button>
    </form>
  );
}
