import Link from "next/link";
import { getT } from "@/lib/i18n";
import { SITE } from "@/lib/constants";
import { Logo } from "./logo";

export async function Footer() {
  const t = await getT();
  return (
    <footer className="mt-16 border-t border-line bg-white">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted">{SITE.tagline}.</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Marketplace</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/cats" className="hover:text-ink">{t("nav.cats")}</Link></li>
            <li><Link href="/adopt" className="hover:text-ink">{t("nav.adopt")}</Link></li>
            <li><Link href="/shop" className="hover:text-ink">{t("nav.shop")}</Link></li>
            <li><Link href="/sell/new" className="hover:text-ink">{t("nav.sell")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">For sellers</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/dashboard/shop" className="hover:text-ink">Get verified</Link></li>
            <li><Link href="/dashboard" className="hover:text-ink">Seller dashboard</Link></li>
            <li><Link href="/safety#prohibited" className="hover:text-ink">Prohibited items</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Meow</p>
          <ul className="space-y-2 text-sm text-muted">
            <li><Link href="/about" className="hover:text-ink">{t("footer.about")}</Link></li>
            <li><Link href="/safety" className="hover:text-ink">{t("footer.safety")}</Link></li>
            <li><Link href="/terms" className="hover:text-ink">{t("footer.terms")}</Link></li>
            <li><Link href="/privacy" className="hover:text-ink">{t("footer.privacy")}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {SITE.name}. Made with love for the cats of Bangladesh.
      </div>
    </footer>
  );
}
