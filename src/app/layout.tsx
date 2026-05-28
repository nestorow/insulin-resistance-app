import type { Metadata, Viewport } from "next";
import "./globals.css";
import SessionProvider from "@/components/SessionProvider";
import AuthBadge from "@/components/AuthBadge";

export const metadata: Metadata = {
  title: "Инсулинова резистентност — 90-дневен протокол",
  description:
    "Персонализиран 90-дневен протокол за обръщане на инсулинова резистентност, базиран на работата на д-р Benjamin Bikman.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ИР Протокол",
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
          <AuthBadge />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
