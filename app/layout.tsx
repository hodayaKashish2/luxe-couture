import type { Metadata, Viewport } from "next";
import { Frank_Ruhl_Libre, Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import { AuthModalProvider } from "@/components/AuthModalProvider";
import { LuxeStorageProvider } from "@/components/LuxeStorageProvider";
import {
  SITE_SEO_DESCRIPTION,
  SITE_SEO_KEYWORDS,
  SITE_SEO_TITLE,
} from "@/lib/site-config";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  title: SITE_SEO_TITLE,
  description: SITE_SEO_DESCRIPTION,
  keywords: SITE_SEO_KEYWORDS,
  icons: { icon: '/logo.svg' },
  openGraph: {
    title: SITE_SEO_TITLE,
    description: SITE_SEO_DESCRIPTION,
    locale: 'he_IL',
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
      className={`${geistSans.variable} ${geistMono.variable} ${frankRuhlLibre.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthModalProvider>
          <AuthProvider>
            <LuxeStorageProvider>{children}</LuxeStorageProvider>
          </AuthProvider>
        </AuthModalProvider>
      </body>
    </html>
  );
}
