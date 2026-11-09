import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Customs AI",
  description: "Document extraction and cross-check tool for customs documentation executives.",
};

// This page is built light-mode-only — without this, some browsers
// (e.g. Chrome's "Auto dark mode for web content") heuristically invert
// panels they guess are light, producing an inconsistent half-dark page.
// (colorScheme lives on viewport, not metadata — metadata.colorScheme is a
// deprecated no-op.)
export const viewport: Viewport = {
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
