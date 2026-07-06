import type { Metadata } from "next";
import { Playfair_Display, Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { env } from "@/lib/env";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { RefCapture } from "@/components/growth/ref-capture";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

const DEFAULT_TITLE = "Под ръка — доверена местна помощ в България";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["майстори", "услуги", "почистване", "ремонти", "уроци", "преместване", "България", "София"],
  openGraph: {
    type: "website",
    locale: "bg_BG",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image", title: DEFAULT_TITLE, description: SITE_DESCRIPTION },
  robots: { index: true, follow: true },
  ...(env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="bg"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${inter.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Scroll reveals hide content until JS observes it — undo for no-JS visitors. */}
        <noscript>
          <style>{`.rv{opacity:1!important;transform:none!important}.pave-stone{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-espresso focus:px-4 focus:py-2 focus:text-background"
        >
          Към съдържанието
        </a>
        <RefCapture />
        <Navbar />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  );
}
