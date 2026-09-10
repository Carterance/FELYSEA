import type { NextAuthConfig } from "next-auth";

/**
 * Config partagée entre le middleware (Edge Runtime) et la config complète
 * (Node runtime, dans auth.ts). Ne JAMAIS importer db/argon2/providers ici :
 * le middleware s'exécute en Edge Runtime, qui ne supporte pas les modules
 * Node natifs (node:crypto tel qu'utilisé par argon2/postgres). Le mettre
 * ici casserait le middleware au démarrage.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
