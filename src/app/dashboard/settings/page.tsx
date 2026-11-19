import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getLocale } from "@/lib/i18n";
import { Badge, Card, PageHeader } from "@/components/ui";
import { ThemePicker } from "@/components/theme-picker";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { LogoutButton } from "@/components/logout-button";
import { buttonClass } from "@/components/ui";

export const metadata: Metadata = { title: "Settings", robots: { index: false } };

export default async function SettingsPage() {
  const user = await requireUser("/dashboard/settings");
  const locale = await getLocale();

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Appearance, language and account options." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="text-h3">Appearance</h2>
          <p className="mb-4 text-sm text-muted">Choose how Meow looks. &ldquo;System&rdquo; follows your device.</p>
          <ThemePicker />
        </Card>
        <Card className="p-5 sm:p-6">
          <h2 className="text-h3">Language</h2>
          <p className="mb-4 text-sm text-muted">Currently {locale === "bn" ? "বাংলা" : "English"}.</p>
          <LocaleSwitcher locale={locale} />
        </Card>
        <Card className="space-y-3 p-5 text-sm sm:p-6">
          <h2 className="text-h3">Account</h2>
          <p className="flex justify-between gap-3"><span className="text-muted">Email</span><span>{user.email}</span></p>
          <p className="flex justify-between gap-3"><span className="text-muted">Username</span><span>@{user.username}</span></p>
          <p className="flex justify-between gap-3">
            <span className="text-muted">Roles</span>
            <span className="flex flex-wrap justify-end gap-1">
              {user.roleList.map((r) => (
                <Badge key={r} tone={r === "admin" ? "brand" : "gray"} className="capitalize">{r}</Badge>
              ))}
            </span>
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link href="/dashboard/profile" className={buttonClass("outline", "sm")}>Edit profile &amp; password</Link>
            <LogoutButton label="Log out" className={buttonClass("outline", "sm")} />
          </div>
        </Card>
      </div>
    </div>
  );
}
