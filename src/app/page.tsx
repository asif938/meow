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
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  ToyBrick,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { ListingGrid } from "@/components/listing-card";
import { BlogCard } from "@/components/blog-card";
import { FaqList } from "@/components/faq-list";
import { HeroCarousel, type HeroSlide } from "@/components/home/hero-carousel";
import { CountUp } from "@/components/home/count-up";
import { NewsletterForm } from "@/components/home/newsletter-form";
import { Alert, Badge, buttonClass } from "@/components/ui";
import { getCategories, getWishedIds, searchListings } from "@/lib/queries";
import { getLatestPosts, getPlatformStats, getTestimonials, getTrustedSellers } from "@/lib/content-queries";
import { getCurrentUser } from "@/lib/session";
import { getT, type T } from "@/lib/i18n";
import { cldTransform } from "@/lib/cloudinary";
import { FAQS } from "@/lib/faq";
import { formatBDT, timeAgo } from "@/lib/utils";

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

const STEPS = [
  { icon: Search, title: "Search & filter", desc: "Find cats, adoptable pets and supplies by breed, price, location and verified sellers." },
  { icon: ShieldCheck, title: "Check the details", desc: "Every cat listing shows vaccine and health information. Look for the verified badge." },
  { icon: MessageCircle, title: "Chat or request", desc: "Message the seller inside Meow, send an adoption request, or order supplies with cash on delivery." },
  { icon: Star, title: "Meet, receive & review", desc: "Meet in a safe place or get your order delivered, then leave a review to help the community." },
];

export default async function HomePage() {
  const t = await getT();
  const [featured, adoption, fresh, categories, user, stats, testimonials, sellers, posts] = await Promise.all([
    searchListings({ type: "cat", limit: 8, sort: "popular" }).catch(() => null),
    searchListings({ type: "adoption", limit: 4 }).catch(() => null),
    searchListings({ type: "supply", limit: 8 }).catch(() => null),
    getCategories().catch(() => []),
    getCurrentUser(),
    getPlatformStats().catch(() => null),
    getTestimonials(6).catch(() => []),
    getTrustedSellers(6).catch(() => []),
    getLatestPosts(3).catch(() => []),
  ]);
  const ids = [featured, adoption, fresh].flatMap((r) => r?.items.map((i) => i.id) ?? []);
  const wished = user ? await getWishedIds(user.id, ids).catch(() => undefined) : undefined;
  const topCategories = categories.filter((c) => !c.parentId && c.listingType === "supply");

  const slides: HeroSlide[] = [...(featured?.items ?? []), ...(adoption?.items ?? [])]
    .filter((i) => i.cover)
    .slice(0, 5)
    .map((i) => ({
      slug: i.slug,
      title: i.title,
      image: cldTransform(i.cover!, "f_auto,q_auto,c_fill,w_900,h_675"),
      price: i.type === "adoption" ? (i.adoptionFee ? `Rehoming fee ${formatBDT(i.adoptionFee)}` : "Free adoption") : formatBDT(i.price),
      location: [i.area, i.district].filter(Boolean).join(", ") || "Bangladesh",
      kind: i.type === "adoption" ? "Up for adoption" : "Featured cat",
    }));

  return (
    <>
      {/* 1 · Hero (60–70% of the viewport on desktop) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-100/70 via-brand-50 to-cream">
        <PawDecor />
        <div className="container-page relative grid items-center gap-8 py-10 sm:py-14 lg:h-[65vh] lg:max-h-[640px] lg:min-h-[460px] lg:grid-cols-[1.1fr_0.9fr] lg:py-0">
          <div>
            <p className="mb-4 inline-flex items-center gap-1.5 rounded-xl bg-surface/80 px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Verified sellers · Health info on every cat
            </p>
            <h1 className="text-h1 text-ink">{t("home.hero.title")}</h1>
            <p className="mt-4 max-w-xl text-lead">{t("home.hero.subtitle")}</p>
            <div className="mt-6 max-w-xl">
              <Suspense>
                <SearchBar placeholder={t("search.placeholder")} buttonLabel={t("search.button")} />
              </Suspense>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/cats" className={buttonClass("primary", "lg")}>
                {t("home.entry.cats")} <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/adopt" className={buttonClass("outline", "lg")}>
                <HeartHandshake className="h-4 w-4" /> {t("home.entry.adopt")}
              </Link>
            </div>
          </div>
          {slides.length > 0 && (
            <div className="hidden lg:block">
              <HeroCarousel slides={slides} />
            </div>
          )}
        </div>
      </section>

      <div className="container-page space-y-16 py-12">
        {!featured && (
          <Alert tone="amber">
            <p className="font-semibold">Database not connected yet</p>
            <p className="mt-1">
              Set <code>DATABASE_URL</code> in <code>.env.local</code>, then run <code>npm run db:deploy</code> and <code>npm run db:seed</code>.
            </p>
          </Alert>
        )}

        {/* 2 · Categories */}
        {topCategories.length > 0 && (
          <Section title={t("home.categories")} subtitle="Everything your cat needs, from food to furniture." href="/shop" t={t}>
            <div className="grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-8">
              {topCategories.map((c) => {
                const Icon = ICONS[c.icon ?? ""] ?? PawPrint;
                return (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4 text-center text-sm font-medium transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
                  >
                    <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600">
                      <Icon className="h-6 w-6" aria-hidden />
                    </span>
                    {t.locale === "bn" && c.nameBn ? c.nameBn : c.name}
                  </Link>
                );
              })}
            </div>
          </Section>
        )}

        {/* 3 · Featured cats */}
        {featured && featured.items.length > 0 && (
          <Section title={t("home.featured")} subtitle="Most viewed cats this week, each with health and vaccine details." href="/cats" t={t}>
            <ListingGrid items={featured.items} wished={wished} className="lg:grid-cols-4" />
          </Section>
        )}

        {/* 4 · Adoption */}
        {adoption && adoption.items.length > 0 && (
          <Section title={t("home.adoption")} subtitle="Rescued and rehomed cats looking for a forever family." href="/adopt" t={t}>
            <ListingGrid items={adoption.items} wished={wished} className="lg:grid-cols-4" />
          </Section>
        )}

        {/* 5 · Live statistics */}
        {stats && (
          <section aria-labelledby="stats-title" className="rounded-xl bg-night p-6 text-white sm:p-10">
            <h2 id="stats-title" className="text-h2 text-center">Meow in numbers</h2>
            <p className="mx-auto mt-1 max-w-lg text-center text-sm text-stone-300">Live figures from our marketplace, updated every few minutes.</p>
            <dl className="mt-8 grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
              <Stat label="Active listings" value={stats.listings} icon={PawPrint} />
              <Stat label="Verified sellers" value={stats.sellers} icon={BadgeCheck} />
              <Stat label="Cats rehomed" value={stats.adoptions} icon={HeartHandshake} />
              <Stat label="Community members" value={stats.users} icon={Users} />
            </dl>
          </section>
        )}

        {/* 6 · How it works */}
        <Section title="How Meow works" subtitle="From first search to a happy cat in four steps." t={t}>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="relative rounded-xl border border-line bg-surface p-5">
                <span className="absolute right-4 top-3 font-display text-4xl font-extrabold text-brand-100">{i + 1}</span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <s.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-h3">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
              </li>
            ))}
          </ol>
        </Section>

        {/* 7 · New arrivals */}
        {fresh && fresh.items.length > 0 && (
          <Section title={t("home.new")} subtitle="Fresh supplies from verified shops and cat owners." href="/shop" t={t}>
            <ListingGrid items={fresh.items} wished={wished} className="lg:grid-cols-4" />
          </Section>
        )}

        {/* 8 · Trusted sellers (partners) */}
        {sellers.length > 0 && (
          <Section title="Trusted shops & shelters" subtitle="Verified partners whose documents our team has checked." t={t}>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sellers.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/seller/${s.username}`}
                    className="flex h-full items-center gap-4 rounded-xl border border-line bg-surface p-4 transition hover:border-brand-200 hover:shadow-md"
                  >
                    <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-100 font-display text-xl font-bold text-brand-700">
                      {s.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                      ) : (
                        s.name.charAt(0)
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-semibold">
                        <span className="truncate">{s.name}</span>
                        <BadgeCheck className="h-4 w-4 shrink-0 text-sky-700" aria-label="Verified" />
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                        <Badge tone={s.type === "shelter" ? "teal" : "brand"} className="capitalize">{s.type === "business" ? "Shop" : s.type}</Badge>
                        {s.listings} active listing{s.listings === 1 ? "" : "s"}
                      </span>
                      {s.bio && <span className="mt-1 line-clamp-2 block text-xs text-muted">{s.bio}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 9 · Testimonials */}
        {testimonials.length > 0 && (
          <Section
            title="What our community says"
            subtitle={stats?.rating ? `${stats.rating} out of 5 across ${stats.reviews} review${stats.reviews === 1 ? "" : "s"}.` : undefined}
            t={t}
          >
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((r) => (
                <li key={r.id}>
                  <figure className="flex h-full flex-col rounded-xl border border-line bg-surface p-5">
                    <div className="flex gap-0.5 text-amber-500" role="img" aria-label={`${r.rating} out of 5 stars`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-current" : "opacity-25"}`} aria-hidden />
                      ))}
                    </div>
                    <blockquote className="mt-3 flex-1 text-sm leading-relaxed">“{r.comment}”</blockquote>
                    <figcaption className="mt-4 flex items-center gap-3 border-t border-line pt-3 text-sm">
                      <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 font-semibold text-brand-700">
                        {r.reviewer.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={r.reviewer.avatar} alt="" loading="lazy" className="h-full w-full object-cover" />
                        ) : (
                          r.reviewer.name.charAt(0)
                        )}
                      </span>
                      <span>
                        <span className="block font-medium">{r.reviewer.name}</span>
                        <span className="block text-xs text-muted">
                          on {r.seller.sellerProfile?.shopName ?? r.seller.name} · {timeAgo(r.createdAt)}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* 10 · Blog preview */}
        {posts.length > 0 && (
          <Section title="From the Meow blog" subtitle="Practical advice on cat care, adoption and buying safely." href="/blog" t={t}>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => (
                <BlogCard key={p.id} post={p} />
              ))}
            </div>
          </Section>
        )}

        {/* 11 · FAQ */}
        <section aria-labelledby="faq-title" className="mx-auto max-w-3xl">
          <h2 id="faq-title" className="text-h2 mb-2 text-center">Frequently asked questions</h2>
          <p className="mb-6 text-center text-sm text-muted">
            Can&apos;t find your answer? Visit the <Link href="/help" className="font-semibold text-brand-600 hover:underline">help centre</Link> or{" "}
            <Link href="/contact" className="font-semibold text-brand-600 hover:underline">contact us</Link>.
          </p>
          <FaqList items={FAQS.slice(0, 5)} />
        </section>

        {/* 12 · Newsletter */}
        <section aria-labelledby="news-title" className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
          <h2 id="news-title" className="text-h2">Get cat care tips in your inbox</h2>
          <p className="mx-auto mb-6 mt-2 max-w-lg text-sm text-muted">New articles, adoption stories and safe-buying advice. No spam, unsubscribe anytime.</p>
          <NewsletterForm />
        </section>

        {/* 13 · Call to action */}
        <section className="flex flex-col items-center gap-4 rounded-xl bg-brand-600 px-6 py-10 text-center text-white sm:py-14">
          <h2 className="text-h2">Got a cat tree gathering dust?</h2>
          <p className="max-w-lg text-brand-50">
            Sell used cat supplies, rehome a cat responsibly, or open your pet shop on Meow. Posting is free.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/sell/new" className="inline-flex h-12 items-center gap-2 rounded-xl bg-white px-6 font-semibold text-brand-700 hover:bg-brand-50">
              {t("nav.sell")} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/dashboard/shop" className="inline-flex h-12 items-center gap-2 rounded-xl border border-white/60 px-6 font-semibold text-white hover:bg-white/10">
              <Truck className="h-4 w-4" /> Become a verified seller
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

function Section({ title, subtitle, href, t, children }: { title: string; subtitle?: string; href?: string; t: T; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-h2">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
        </div>
        {href && (
          <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            {t("common.viewAll")} <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return (
    <div>
      <Icon className="mx-auto h-6 w-6 text-brand-300" aria-hidden />
      <div className="flex flex-col-reverse">
        <dt className="mt-1 text-sm text-stone-300">{label}</dt>
        <dd className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
          <CountUp value={value} />
        </dd>
      </div>
    </div>
  );
}

function PawDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 text-brand-200/60">
      <PawPrint className="absolute -left-4 top-10 h-24 w-24 -rotate-12" />
      <PawPrint className="absolute bottom-6 left-1/3 h-10 w-10 rotate-45" />
    </div>
  );
}
