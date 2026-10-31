import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Geist_Mono, Heebo } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import { AuthModalProvider } from "@/components/AuthModalProvider";
import { LuxeStorageProvider } from "@/components/LuxeStorageProvider";
import {
  SITE_NAME,
  SITE_SEO_DESCRIPTION,
  SITE_SEO_KEYWORDS,
  SITE_SEO_TITLE,
  getServerAppUrl,
} from "@/lib/site-config";
import SiteStructuredData from "@/components/SiteStructuredData";
import "./globals.css";

const siteBaseUrl = getServerAppUrl().replace(/\/$/, "");

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const frankRuhlLibre = Frank_Ruhl_Libre({
  variable: "--font-luxury",
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteBaseUrl),
  title: SITE_SEO_TITLE,
  description: SITE_SEO_DESCRIPTION,
  keywords: SITE_SEO_KEYWORDS,
  applicationName: SITE_NAME,
  icons: { icon: '/logo.svg' },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_SEO_TITLE,
    description: SITE_SEO_DESCRIPTION,
    locale: 'he_IL',
    url: '/',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      className={`${heebo.variable} ${geistMono.variable} ${frankRuhlLibre.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteStructuredData />
        <AuthModalProvider>
          <AuthProvider>
            <LuxeStorageProvider>{children}</LuxeStorageProvider>
          </AuthProvider>
        </AuthModalProvider>
      </body>
    </html>
  );
}
