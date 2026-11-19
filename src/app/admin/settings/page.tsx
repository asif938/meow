import type { Metadata } from "next";
import { CheckCircle2, CircleSlash } from "lucide-react";
import { db } from "@/db";
import { googleEnabled } from "@/lib/auth";
import { cloudinaryEnabled } from "@/lib/cloudinary";
import { SITE } from "@/lib/constants";
import { Card, PageHeader } from "@/components/ui";
import { ThemePicker } from "@/components/theme-picker";

export const metadata: Metadata = { title: "Admin settings", robots: { index: false } };

export default async function AdminSettingsPage() {
  const [subscribers, categories] = await Promise.all([db.newsletterSubscriber.count(), db.category.count()]);
  const integrations = [
    { label: "Google sign-in", on: googleEnabled, env: "AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET" },
    { label: "Cloudinary image uploads", on: cloudinaryEnabled, env: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET" },
    { label: "Transactional email (Resend)", on: Boolean(process.env.RESEND_API_KEY), env: "RESEND_API_KEY" },
    { label: "SMS gateway (phone OTP)", on: Boolean(process.env.SMS_GATEWAY_URL), env: "SMS_GATEWAY_URL" },
    { label: "Demo login buttons", on: SITE.demoLogin, env: "NEXT_PUBLIC_DEMO_LOGIN=false to hide" },
  ];
  const admins = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Integration status and site configuration. Values are set with environment variables." />
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="text-h3 mb-3">Integrations</h2>
          <ul className="divide-y divide-line text-sm">
            {integrations.map((i) => (
              <li key={i.label} className="flex items-start gap-3 py-3">
                {i.on ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-label="Enabled" />
                ) : (
                  <CircleSlash className="mt-0.5 h-5 w-5 shrink-0 text-muted" aria-label="Disabled" />
                )}
                <div>
                  <p className="font-medium">{i.label}</p>
                  <p className="break-words text-xs text-muted">{i.on ? "Enabled" : "Not configured"} · {i.env}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <div className="space-y-6">
          <Card className="space-y-2 p-5 text-sm sm:p-6">
            <h2 className="text-h3 mb-1">Site</h2>
            <p className="flex justify-between gap-3"><span className="text-muted">Name</span><span>{SITE.name}</span></p>
            <p className="flex justify-between gap-3"><span className="text-muted">Contact email</span><span>{SITE.email}</span></p>
            <p className="flex justify-between gap-3"><span className="text-muted">Newsletter subscribers</span><span>{subscribers}</span></p>
            <p className="flex justify-between gap-3"><span className="text-muted">Categories</span><span>{categories}</span></p>
            <p className="flex justify-between gap-3"><span className="text-muted">Bootstrap admins</span><span className="break-all text-right">{admins.join(", ") || "—"}</span></p>
          </Card>
          <Card className="p-5 sm:p-6">
            <h2 className="text-h3 mb-3">Appearance</h2>
            <ThemePicker />
          </Card>
        </div>
      </div>
    </div>
  );
}
