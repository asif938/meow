import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Nunito } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getLocale } from "@/lib/i18n";
import { SITE } from "@/lib/constants";
import { appUrl } from "@/lib/utils";
import "./globals.css";

const sans = Hind_Siliguri({
  variable: "--font-sans-app",
  subsets: ["latin", "bengali"],
  weight: ["400", "500", "600", "700"],
});
const display = Nunito({ variable: "--font-display-app", subsets: ["latin"], weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: `${SITE.name} — Cats, adoption & cat supplies in Bangladesh`, template: `%s · ${SITE.name}` },
  description: SITE.tagline,
  openGraph: { siteName: SITE.name, type: "website", locale: "en_BD" },
};

export const viewport: Viewport = { themeColor: "#f97316" };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
