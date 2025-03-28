import type { Metadata } from "next";
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
  title: "PostgreSQL Timeline",
  description: "Explore the history of PostgreSQL, when we didn't have all the features we know and love today",
  openGraph: {
    title: "PostgreSQL Timeline",
    description: "Explore the history of PostgreSQL, when we didn't have all the features we know and love today",
    type: "website",
    locale: "en_US",
    siteName: "PostgreSQL Timeline",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PostgreSQL Timeline",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PostgreSQL Timeline",
    description: "Explore the history of PostgreSQL, when we didn't have all the features we know and love today",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
