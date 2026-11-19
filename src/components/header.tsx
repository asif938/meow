import Link from "next/link";
import { Suspense } from "react";
import { MessageCircle, Plus, User } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getUnreadCount } from "@/lib/chat";
import { getCategories } from "@/lib/queries";
import { buttonClass } from "@/components/ui";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { LocaleSwitcher } from "./locale-switcher";
import { ThemeToggle } from "./theme-toggle";
import { ExploreMenu, type MegaGroup } from "./explore-menu";
import { MobileNav, type NavLink } from "./mobile-nav";
import { LogoutButton } from "./logout-button";

const linkClass = "rounded-xl px-3 py-2 text-sm font-medium hover:bg-brand-50";

export async function Header() {
  const [user, t, categories] = await Promise.all([getCurrentUser(), getT(), getCategories().catch(() => [])]);
  const unread = user ? await getUnreadCount(user.id).catch(() => 0) : 0;

  const childrenOf = (slug: string) => {
    const root = categories.find((c) => c.slug === slug);
    return root ? categories.filter((c) => c.parentId === root.id) : [];
  };
  const name = (c: { name: string; nameBn: string | null }) => (t.locale === "bn" && c.nameBn ? c.nameBn : c.name);
  const groups: MegaGroup[] = [
    {
      title: t("nav.cats"),
      href: "/cats",
      description: t("home.entry.cats.desc"),
      links: childrenOf("cats").slice(0, 5).map((c) => ({ label: name(c), href: `/category/${c.slug}` })),
    },
    {
      title: t("nav.adopt"),
      href: "/adopt",
      description: t("home.entry.adopt.desc"),
      links: childrenOf("adoption").slice(0, 5).map((c) => ({ label: name(c), href: `/category/${c.slug}` })),
    },
    {
      title: t("nav.shop"),
      href: "/shop",
      description: t("home.entry.shop.desc"),
      links: categories
        .filter((c) => !c.parentId && c.listingType === "supply")
        .slice(0, 5)
        .map((c) => ({ label: name(c), href: `/category/${c.slug}` })),
    },
  ];

  // Logged out: Home, Explore, Blog, About, Login.  Logged in: Home, Explore, Dashboard, Blog, Profile, Logout.
  const mobileLinks: NavLink[] = user
    ? [
        { href: "/", label: t("nav.home") },
        { href: "/dashboard", label: t("nav.dashboard") },
        { href: "/blog", label: t("nav.blog") },
        { href: "/dashboard/profile", label: t("nav.profile") },
        { href: "/account", label: t("nav.account") },
        { href: "/messages", label: t("nav.messages") },
        ...(user.isAdmin ? [{ href: "/admin", label: t("nav.admin") }] : []),
      ]
    : [
        { href: "/", label: t("nav.home") },
        { href: "/blog", label: t("nav.blog") },
        { href: "/about", label: t("nav.about") },
      ];

  const search = (
    <Suspense>
      <SearchBar placeholder={t("search.placeholder")} compact />
    </Suspense>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-surface/90 backdrop-blur">
      <div className="container-wide flex h-16 items-center gap-2">
        <Logo />
        <nav aria-label="Main" className="ml-4 hidden items-center gap-1 lg:flex">
          <Link href="/" className={linkClass}>{t("nav.home")}</Link>
          <ExploreMenu label={t("nav.explore")} groups={groups} allLabel={t("common.viewAll")} />
          {user && <Link href="/dashboard" className={linkClass}>{t("nav.dashboard")}</Link>}
          <Link href="/blog" className={linkClass}>{t("nav.blog")}</Link>
          {!user && <Link href="/about" className={linkClass}>{t("nav.about")}</Link>}
        </nav>

        <div className="ml-auto hidden max-w-xs flex-1 xl:block">{search}</div>

        <div className="ml-auto flex items-center gap-1 xl:ml-2">
          <div className="hidden sm:flex">
            <LocaleSwitcher locale={t.locale} />
          </div>
          <ThemeToggle className="hidden lg:inline-flex" />
          {user ? (
            <>
              <Link href="/messages" className={buttonClass("ghost", "icon", "relative")} aria-label={t("nav.messages")}>
                <MessageCircle className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <div className="hidden lg:block">
                <UserMenu
                  name={user.name}
                  email={user.email}
                  avatar={user.avatar}
                  isAdmin={user.isAdmin}
                  labels={{
                    dashboard: t("nav.dashboard"),
                    profile: t("nav.profile"),
                    account: t("nav.account"),
                    messages: t("nav.messages"),
                    admin: t("nav.admin"),
                    settings: "Settings",
                  }}
                />
              </div>
              <LogoutButton label={t("nav.logout")} className={buttonClass("ghost", "sm", "hidden lg:inline-flex")} />
            </>
          ) : (
            <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
              <User className="h-4 w-4" /> {t("nav.login")}
            </Link>
          )}
          <Link href="/sell/new" className={buttonClass("primary", "md", "ml-1 hidden sm:inline-flex")}>
            <Plus className="h-4 w-4" /> {t("nav.sell")}
          </Link>
          <MobileNav
            links={mobileLinks}
            groups={groups}
            exploreLabel={t("nav.explore")}
            loggedIn={Boolean(user)}
            logoutLabel={t("nav.logout")}
            loginLabel={t("nav.login")}
            registerLabel={t("nav.register")}
            sellLabel={t("nav.sell")}
          >
            {search}
          </MobileNav>
        </div>
      </div>
    </header>
  );
}
