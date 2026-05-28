"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

// Client wrapper around next-auth/react SessionProvider so useSession() works
// in any client component. Mounted once in the root layout.
export default function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
