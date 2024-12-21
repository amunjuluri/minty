import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Providers } from "./providers";


const myFont = localFont({
  src: "./fonts/CalSans-SemiBold.woff2"
});

export const metadata: Metadata = {
  title: "Minty",
  description: "Minimal Document Generator",
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
