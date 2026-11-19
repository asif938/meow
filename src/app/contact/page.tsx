import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { SITE } from "@/lib/constants";
import { getCurrentUser } from "@/lib/session";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions, feedback or a report? Send us a message and we will get back to you.",
};

export default async function ContactPage() {
  const user = await getCurrentUser();
  const info = [
    { icon: Mail, label: "Email", value: SITE.email, href: `mailto:${SITE.email}` },
    { icon: Phone, label: "Phone", value: SITE.phone, href: `tel:${SITE.phone.replace(/[^+\d]/g, "")}` },
    { icon: MapPin, label: "Address", value: SITE.address },
    { icon: Clock, label: "Support hours", value: "Sat–Thu, 10:00–18:00 (BST)" },
  ];
  return (
    <div className="container-page py-8 sm:py-10">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-h1">Contact us</h1>
        <p className="mt-3 text-lead">Questions, feedback or something that needs our attention? Send a message and we&apos;ll reply within one business day.</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="rounded-xl border border-line bg-surface p-5 sm:p-7">
          <ContactForm defaultName={user?.name} defaultEmail={user?.email} />
        </div>
        <aside aria-label="Contact details" className="space-y-3">
          {info.map(({ icon: Icon, label, value, href }) => (
            <div key={label} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted">{label}</p>
                {href ? (
                  <a href={href} className="break-words font-medium hover:text-brand-600">{value}</a>
                ) : (
                  <p className="font-medium">{value}</p>
                )}
              </div>
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}
