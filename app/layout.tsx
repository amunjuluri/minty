import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const myFont = localFont({
  src: "./fonts/CalSans-SemiBold.woff2"
});

export const metadata: Metadata = {
  title: "Minty Docs",
  description: "A minimal doc generator for your cute github repos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${myFont.className}`}
      >
        <Providers>
        {children}
        </Providers>
      </body>
    </html>
  );
}
