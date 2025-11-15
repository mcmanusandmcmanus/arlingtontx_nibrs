import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

import { AuthProvider } from "@/context/auth-context";
import { SiteHeader } from "@/components/layout/SiteHeader";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Arlington PD Data Empowerment",
  description:
    "District-level analytics, uploads, and ML labs for Arlington Police Department field teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} bg-slate-950 text-slate-100 antialiased`}>
        <AuthProvider>
          <SiteHeader />
          <main className="pb-20">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
