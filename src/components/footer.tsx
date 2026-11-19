import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Facebook, Instagram, Youtube } from "./social-icons";
import { getT } from "@/lib/i18n";
import { SITE } from "@/lib/constants";
import { Logo } from "./logo";

const col = "space-y-2 text-sm text-muted";
const link = "hover:text-ink";

export async function Footer() {
  const t = await getT();
  const social = [
    { href: SITE.social.facebook, label: "Facebook", Icon: Facebook },
    { href: SITE.social.instagram, label: "Instagram", Icon: Instagram },
    { href: SITE.social.youtube, label: "YouTube", Icon: Youtube },
  ];
  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-1">
          <Logo />
          <p className="text-sm text-muted">{SITE.tagline}.</p>
          <div className="flex gap-2">
            {social.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="grid h-9 w-9 place-items-center rounded-xl border border-line text-muted hover:border-brand-300 hover:text-brand-600"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Marketplace</p>
          <ul className={col}>
            <li><Link href="/cats" className={link}>{t("nav.cats")}</Link></li>
            <li><Link href="/adopt" className={link}>{t("nav.adopt")}</Link></li>
            <li><Link href="/shop" className={link}>{t("nav.shop")}</Link></li>
            <li><Link href="/sell/new" className={link}>{t("nav.sell")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">For sellers</p>
          <ul className={col}>
            <li><Link href="/dashboard/shop" className={link}>Get verified</Link></li>
            <li><Link href="/dashboard" className={link}>Seller dashboard</Link></li>
            <li><Link href="/safety#prohibited" className={link}>Prohibited items</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Meow</p>
          <ul className={col}>
            <li><Link href="/about" className={link}>{t("footer.about")}</Link></li>
            <li><Link href="/blog" className={link}>{t("nav.blog")}</Link></li>
            <li><Link href="/help" className={link}>Help centre</Link></li>
            <li><Link href="/contact" className={link}>Contact us</Link></li>
            <li><Link href="/safety" className={link}>{t("footer.safety")}</Link></li>
            <li><Link href="/terms" className={link}>{t("footer.terms")}</Link></li>
            <li><Link href="/privacy" className={link}>{t("footer.privacy")}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold">Contact</p>
          <ul className={col}>
            <li className="flex gap-2"><Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><a href={`mailto:${SITE.email}`} className={link}>{SITE.email}</a></li>
            <li className="flex gap-2"><Phone className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><a href={`tel:${SITE.phone.replace(/[^+\d]/g, "")}`} className={link}>{SITE.phone}</a></li>
            <li className="flex gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /><span>{SITE.address}</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {SITE.name}. All rights reserved. Made with love for the cats of Bangladesh.
      </div>
    </footer>
  );
}
