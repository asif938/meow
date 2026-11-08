import Link from "next/link";
import { Suspense } from "react";
import { MessageCircle, Plus, Shield, User } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { getT } from "@/lib/i18n";
import { getUnreadCount } from "@/lib/chat";
import { buttonClass } from "@/components/ui";
import { Logo } from "./logo";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { LocaleSwitcher } from "./locale-switcher";

export async function Header() {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const unread = user ? await getUnreadCount(user.id).catch(() => 0) : 0;
  const search = (
    <Suspense>
      <SearchBar placeholder={t("search.placeholder")} compact />
    </Suspense>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-3">
        <Logo />
        <nav className="ml-4 hidden items-center gap-1 text-sm font-medium lg:flex">
          <Link href="/cats" className="rounded-full px-3 py-2 hover:bg-brand-50">{t("nav.cats")}</Link>
          <Link href="/adopt" className="rounded-full px-3 py-2 hover:bg-brand-50">{t("nav.adopt")}</Link>
          <Link href="/shop" className="rounded-full px-3 py-2 hover:bg-brand-50">{t("nav.shop")}</Link>
        </nav>
        <div className="ml-auto hidden max-w-sm flex-1 md:block">{search}</div>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          <LocaleSwitcher locale={t.locale} />
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin" className={buttonClass("ghost", "icon")} aria-label={t("nav.admin")}>
                  <Shield className="h-5 w-5" />
                </Link>
              )}
              <Link href="/messages" className={buttonClass("ghost", "icon", "relative")} aria-label={t("nav.messages")}>
                <MessageCircle className="h-5 w-5" />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
              <UserMenu
                name={user.name}
                avatar={user.avatar}
                isAdmin={user.isAdmin}
                labels={{
                  dashboard: t("nav.dashboard"),
                  account: t("nav.account"),
                  messages: t("nav.messages"),
                  admin: t("nav.admin"),
                  logout: t("nav.logout"),
                }}
              />
            </>
          ) : (
            <Link href="/login" className={buttonClass("ghost", "sm", "hidden sm:inline-flex")}>
              <User className="h-4 w-4" /> {t("nav.login")}
            </Link>
          )}
          <Link href="/sell/new" className={buttonClass("primary", "md", "ml-1 hidden sm:inline-flex")}>
            <Plus className="h-4 w-4" /> {t("nav.sell")}
          </Link>
        </div>
      </div>
      {/* Mobile: search + quick nav */}
      <div className="container-page pb-2 md:hidden">{search}</div>
      <nav className="container-page scrollbar-none flex gap-2 overflow-x-auto pb-3 text-sm font-medium lg:hidden">
        <Link href="/cats" className="shrink-0 rounded-full bg-brand-50 px-3 py-1.5 text-brand-700">{t("nav.cats")}</Link>
        <Link href="/adopt" className="shrink-0 rounded-full bg-teal-50 px-3 py-1.5 text-teal-800">{t("nav.adopt")}</Link>
        <Link href="/shop" className="shrink-0 rounded-full bg-stone-100 px-3 py-1.5">{t("nav.shop")}</Link>
        <Link href="/sell/new" className="shrink-0 rounded-full bg-brand-500 px-3 py-1.5 text-white sm:hidden">+ {t("nav.sell")}</Link>
        {!user && (
          <Link href="/login" className="shrink-0 rounded-full border border-line px-3 py-1.5 sm:hidden">{t("nav.login")}</Link>
        )}
      </nav>
    </header>
  );
}
