import type { NextAuthConfig } from "next-auth";

/**
 * Config partagée entre le proxy (src/proxy.ts, anciennement middleware.ts)
 * et la config complète (dans auth.ts). Le proxy tourne en runtime Node.js
 * depuis Next.js 16, mais reste volontairement minimal et chargé en premier
 * sur chaque requête : ne JAMAIS y importer db/argon2/providers, pour garder
 * ce chemin léger et éviter tout risque de régression si Next réintroduit
 * une contrainte de runtime plus tard.
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
