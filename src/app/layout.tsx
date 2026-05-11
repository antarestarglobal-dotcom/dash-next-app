import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import Link from "next/link";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ANTARESTAR CEO Command Center",
  description: "Internal business dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full bg-stone-50 text-neutral-950">
        <Providers>
          <header className="border-b-2 border-neutral-950 bg-white">
            <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
              <Link href="/" className="font-black text-sm uppercase tracking-widest text-neutral-950">
                ANTARESTAR CC
              </Link>
              <nav className="flex gap-6 text-sm font-semibold">
                <Link href="/dashboard" className="hover:text-neutral-600 transition-colors">
                  Dashboard
                </Link>
                <Link href="/imports" className="hover:text-neutral-600 transition-colors">
                  Import
                </Link>
                <Link href="/imports/history" className="hover:text-neutral-600 transition-colors">
                  History
                </Link>
              </nav>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-5 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
