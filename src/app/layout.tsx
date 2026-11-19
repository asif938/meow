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

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffaf5" },
    { media: "(prefers-color-scheme: dark)", color: "#161210" },
  ],
};

// Runs before paint so the saved (or system) theme is applied without a flash.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t?t==="dark":window.matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${sans.variable} ${display.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
