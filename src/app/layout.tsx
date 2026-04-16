import type { Metadata } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import { PageTracker } from "@/components/layout/PageTracker";
import { CookieConsent } from "@/components/layout/CookieConsent";
import { AnalyticsProvider } from "@/components/layout/AnalyticsProvider";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
  fallback: ["system-ui", "Arial", "sans-serif"],
  adjustFontFallback: false,
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["italic"],
  variable: "--font-playfair",
  display: "swap",
  fallback: ["Georgia", "serif"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: {
    default: "HumbleHalal — Singapore's Halal Ecosystem",
    template: "%s | HumbleHalal",
  },
  description:
    "Singapore's all-in-one halal ecosystem: restaurants, Muslim businesses, events, mosque finder, travel guides, and halal product reviews.",
  metadataBase: new URL("https://humblehalal.sg"),
  openGraph: {
    type: "website",
    locale: "en_SG",
    url: "https://humblehalal.sg",
    siteName: "HumbleHalal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${playfairDisplay.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="font-sans antialiased">
        <AnalyticsProvider>
          <PageTracker />
          {children}
          <CookieConsent />
        </AnalyticsProvider>
      </body>
    </html>
  );
}
