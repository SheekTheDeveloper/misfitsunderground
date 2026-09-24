import type { Metadata } from "next";
import { Bebas_Neue, Inter } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/config/site";
import "./globals.css";

const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  metadataBase: new URL(`https://${site.domain}`),
  title: `${site.name} | Roobet Leaderboard`,
  description: `Wager on Roobet under code ${site.affiliateCode} and compete for a share of the monthly prize pool.`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bebas.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <div className="mx-auto max-w-4xl px-4 pb-16">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
