import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import { v4 as uuid } from "uuid";

// NextAuth v4 config. Pattern adapted from thyroid-rehab/src/lib/auth.ts,
// trimmed to Phase 0 essentials (Google sign-in + Turso user upsert + lens).

const providers: NextAuthOptions["providers"] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          const existing = await db.execute({
            sql: "SELECT id FROM users WHERE email = ?",
            args: [user.email],
          });

          if (existing.rows.length === 0) {
            await db.execute({
              sql: "INSERT INTO users (id, email, name, image) VALUES (?, ?, ?, ?)",
              args: [user.id || uuid(), user.email, user.name || null, user.image || null],
            });
          } else {
            await db.execute({
              sql: "UPDATE users SET last_login_at = datetime('now') WHERE email = ?",
              args: [user.email],
            });
          }
        } catch (error: unknown) {
          const msg = error instanceof Error ? error.message : String(error);
          if (!msg.includes("UNIQUE constraint")) {
            console.error("signIn upsert error:", msg);
          }
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      // On first sign-in (user present) or refresh, hydrate id + lens from DB.
      const email = user?.email || token.email;
      if (email) {
        try {
          const res = await db.execute({
            sql: "SELECT id, lens FROM users WHERE email = ?",
            args: [email],
          });
          if (res.rows.length > 0) {
            token.uid = res.rows[0].id as string;
            token.lens = (res.rows[0].lens as string | null) ?? null;
          }
        } catch {
          // non-critical; keep existing token
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? "";
        session.user.lens = (token.lens as string | null) ?? null;
      }
      return session;
    },
  },
};
