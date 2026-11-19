import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, HeartHandshake, MessageCircle, ShieldCheck, ShoppingBag, UserCircle } from "lucide-react";
import { FaqList } from "@/components/faq-list";
import { buttonClass } from "@/components/ui";
import { FAQS } from "@/lib/faq";

export const metadata: Metadata = {
  title: "Help centre",
  description: "Answers about buying, adopting, selling and staying safe on Meow.",
};

const TOPICS = [
  { icon: ShoppingBag, title: "Buying a cat or supplies", desc: "How listings, chat and cash-on-delivery orders work.", href: "/cats" },
  { icon: HeartHandshake, title: "Adopting a cat", desc: "Send a request, meet the owner and complete the adoption.", href: "/adopt" },
  { icon: UserCircle, title: "Selling & verification", desc: "Post an ad and become a verified seller, shop or shelter.", href: "/dashboard/shop" },
  { icon: ShieldCheck, title: "Safety & prohibited items", desc: "Rules that keep cats and people safe.", href: "/safety" },
  { icon: BookOpen, title: "Cat care guides", desc: "Articles from the Meow team.", href: "/blog" },
  { icon: MessageCircle, title: "Talk to us", desc: "Still stuck? Send us a message.", href: "/contact" },
];

export default function HelpPage() {
  return (
    <div className="container-page max-w-4xl py-8 sm:py-10">
      <header className="mb-8">
        <h1 className="text-h1">Help centre</h1>
        <p className="mt-3 text-lead">Quick answers to the most common questions, and where to go next.</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOPICS.map((t) => (
          <Link key={t.title} href={t.href} className="rounded-xl border border-line bg-surface p-4 transition hover:border-brand-200 hover:shadow-md">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <t.icon className="h-5 w-5" aria-hidden />
            </span>
            <p className="mt-3 font-semibold">{t.title}</p>
            <p className="mt-0.5 text-sm text-muted">{t.desc}</p>
          </Link>
        ))}
      </div>

      <h2 className="text-h2 mb-4 mt-12">Frequently asked questions</h2>
      <FaqList items={FAQS} />

      <div className="mt-10 flex flex-col items-start gap-3 rounded-xl bg-brand-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-h3">Didn&apos;t find what you need?</p>
          <p className="text-sm text-muted">Our team replies within one business day.</p>
        </div>
        <Link href="/contact" className={buttonClass("primary", "md")}>Contact support</Link>
      </div>
    </div>
  );
}
