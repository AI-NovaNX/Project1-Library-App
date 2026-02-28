import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";

import { Providers } from "@/app/providers";

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Library App",
  description: "Library web app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${quicksand.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
