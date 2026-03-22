import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Poly SDK Web - Polymarket Explorer",
  description: "Interactive demo of @catalyst-team/poly-sdk featuring market data, smart money analysis, and trading tools",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col bg-[var(--background)] md:flex-row`}>
        <Sidebar />
        <main className="min-h-0 min-w-0 flex-1 p-4 pb-10 md:p-8 md:pb-12">
          {children}
        </main>
      </body>
    </html>
  );
}
