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
  // Auth.js ne fait confiance qu'à l'hôte de la requête que sur Vercel par
  // défaut. En dehors de Vercel (ex: Render), sans ce flag, chaque appel à
  // /api/auth/* échoue avec `UntrustedHost`. Sûr ici : l'app n'est jamais
  // exposée derrière un proxy qui laisserait un tiers falsifier le header
  // Host, et NEXT_PUBLIC_APP_URL reste la seule URL canonique utilisée pour
  // générer des liens (emails, etc.).
  trustHost: true,
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
