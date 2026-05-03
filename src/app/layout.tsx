import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { AuthProvider } from "@/context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AdCast Dashboard",
  description: "Manage your advertising screens seamlessly.",
};

import Script from "next/script";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if (typeof globalThis === 'undefined') {
            window.globalThis = window;
          }
        `}} />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/core-js-bundle/3.33.0/minified.js"></script>
        <script src="https://unpkg.com/abortcontroller-polyfill/dist/abortcontroller-polyfill-only.js"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased bg-[#050505] text-white overflow-hidden flex`}
      >
        <AuthProvider>
          <Sidebar />
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <TopBar />
            <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/[0.03] to-transparent">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
