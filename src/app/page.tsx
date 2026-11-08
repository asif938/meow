import Link from "next/link";
import { Suspense } from "react";
import {
  Armchair,
  ArrowRight,
  BadgeCheck,
  Bone,
  Cat,
  HeartHandshake,
  HeartPulse,
  Luggage,
  MessageCircle,
  PawPrint,
  Scissors,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ToyBrick,
  type LucideIcon,
} from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { ListingGrid } from "@/components/listing-card";
import { getCategories, getWishedIds, searchListings } from "@/lib/queries";
import { getCurrentUser } from "@/lib/session";
import { getT, type T } from "@/lib/i18n";

const ICONS: Record<string, LucideIcon> = {
  cat: Cat,
  heart: HeartHandshake,
  food: Bone,
  litter: Sparkles,
  toys: ToyBrick,
  health: HeartPulse,
  grooming: Scissors,
  accessories: PawPrint,
  furniture: Armchair,
  travel: Luggage,
};

export default async function HomePage() {
  const t = await getT();
  const [featured, adoption, fresh, categories, user] = await Promise.all([
    searchListings({ type: "cat", limit: 8, sort: "popular" }).catch(() => null),
    searchListings({ type: "adoption", limit: 4 }).catch(() => null),
    searchListings({ type: "supply", limit: 8 }).catch(() => null),
    getCategories().catch(() => []),
    getCurrentUser(),
  ]);
  const ids = [featured, adoption, fresh].flatMap((r) => r?.items.map((i) => i.id) ?? []);
  const wished = user ? await getWishedIds(user.id, ids).catch(() => undefined) : undefined;
  const topCategories = categories.filter((c) => !c.parentId && c.listingType === "supply");

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-100/70 via-brand-50 to-cream">
        <PawDecor />
        <div className="container-page relative py-12 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified sellers · Health info on every cat
            </p>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">{t("home.hero.title")}</h1>
            <p className="mx-auto mt-4 max-w-xl text-base text-muted sm:text-lg">{t("home.hero.subtitle")}</p>
            <div className="mx-auto mt-8 max-w-2xl">
              <Suspense>
                <SearchBar placeholder={t("search.placeholder")} buttonLabel={t("search.button")} />
              </Suspense>
            </div>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-3 sm:grid-cols-3">
            <EntryCard href="/cats" icon={Cat} title={t("home.entry.cats")} desc={t("home.entry.cats.desc")} tone="brand" />
            <EntryCard href="/adopt" icon={HeartHandshake} title={t("home.entry.adopt")} desc={t("home.entry.adopt.desc")} tone="teal" />
            <EntryCard href="/shop" icon={ShoppingBag} title={t("home.entry.shop")} desc={t("home.entry.shop.desc")} tone="stone" />
          </div>
        </div>
      </section>

      <div className="container-page space-y-14 py-10">
        {featured && featured.items.length > 0 && (
          <Section title={t("home.featured")} href="/cats" t={t}>
            <ListingGrid items={featured.items} wished={wished} />
          </Section>
        )}

        {adoption && adoption.items.length > 0 && (
          <Section title={t("home.adoption")} href="/adopt" t={t}>
            <ListingGrid items={adoption.items} wished={wished} />
          </Section>
        )}

        {topCategories.length > 0 && (
          <Section title={t("home.categories")} href="/shop" t={t}>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {topCategories.map((c) => {
                const Icon = ICONS[c.icon ?? ""] ?? PawPrint;
                return (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-white p-4 text-center text-sm font-medium transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                      <Icon className="h-6 w-6" />
                    </span>
                    {t.locale === "bn" && c.nameBn ? c.nameBn : c.name}
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {fresh && fresh.items.length > 0 && (
          <Section title={t("home.new")} href="/shop" t={t}>
            <ListingGrid items={fresh.items} wished={wished} />
          </Section>
        )}

        {!featured && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-semibold">Database not connected yet</p>
            <p className="mt-1">
              Set <code>DATABASE_URL</code> in <code>.env.local</code>, then run <code>npm run db:migrate</code> and{" "}
              <code>npm run db:seed</code>.
            </p>
          </div>
        )}

        {/* Trust strip */}
        <section className="grid gap-4 rounded-[var(--radius-card)] bg-ink p-6 text-white sm:grid-cols-3 sm:p-10">
          <Trust icon={BadgeCheck} title="Verified sellers" desc="Phone OTP, NID and trade-license checks. Look for the blue badge." />
          <Trust icon={HeartPulse} title="Welfare first" desc="No kittens under 8 weeks. Vaccine & health info is mandatory." />
          <Trust icon={MessageCircle} title="Chat safely" desc="Keep conversations on Meow and meet in public places." />
        </section>

        <section className="flex flex-col items-center gap-4 rounded-[var(--radius-card)] bg-brand-500 px-6 py-10 text-center text-white sm:py-14">
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">Got a cat tree gathering dust?</h2>
          <p className="max-w-lg text-brand-50">
            Sell used cat supplies, rehome a cat responsibly, or open your pet shop on Meow. Posting is free.
          </p>
          <Link href="/sell/new" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-6 font-semibold text-brand-700 hover:bg-brand-50">
            {t("nav.sell")} <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </>
  );
}

function Section({ title, href, t, children }: { title: string; href: string; t: T; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-end justify-between">
        <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
          {t("common.viewAll")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function EntryCard({
  href,
  icon: Icon,
  title,
  desc,
  tone,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  tone: "brand" | "teal" | "stone";
}) {
  const tones = {
    brand: "bg-brand-500 text-white",
    teal: "bg-teal-600 text-white",
    stone: "bg-ink text-white",
  };
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-[var(--radius-card)] border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg sm:flex-col sm:items-start sm:p-5"
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span>
        <span className="flex items-center gap-1 font-display text-lg font-bold">
          {title} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
        <span className="text-sm text-muted">{desc}</span>
      </span>
    </Link>
  );
}

function Trust({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="h-6 w-6 shrink-0 text-brand-300" />
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-stone-300">{desc}</p>
      </div>
    </div>
  );
}

function PawDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 text-brand-200/60">
      <PawPrint className="absolute -left-4 top-10 h-24 w-24 -rotate-12" />
      <PawPrint className="absolute right-6 top-24 h-16 w-16 rotate-12" />
      <PawPrint className="absolute bottom-6 left-1/3 h-10 w-10 rotate-45" />
    </div>
  );
}
