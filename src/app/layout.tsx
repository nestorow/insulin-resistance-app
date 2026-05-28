import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import AuthBadge from "@/components/AuthBadge";
import SyncOnLogin from "@/components/SyncOnLogin";

export const metadata: Metadata = {
  title: "InsulinReset — 90-дневен протокол",
  description:
    "InsulinReset — 90-дневно обръщане на инсулиновата резистентност, базирано на работата на д-р Benjamin Bikman.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "InsulinReset",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B7A6E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bg">
      <body className="antialiased">
        <SessionProvider>
          <SyncOnLogin />
          <AuthBadge />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
