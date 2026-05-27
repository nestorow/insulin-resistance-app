import type { DefaultSession } from "next-auth";

// Augment NextAuth types with the fields we hydrate from Turso.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      lens: string | null; // 'medical' | 'educational' | 'biohacker'
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    lens?: string | null;
  }
}
