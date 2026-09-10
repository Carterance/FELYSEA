import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const limit = rateLimit(`login:${email}`, { max: 8, windowMs: 5 * 60_000 });
        if (!limit.allowed) return null;

        // Timing note: on garde un chemin de vérification à durée quasi
        // constante en appelant toujours verifyPassword, même si l'email
        // n'existe pas, pour limiter l'énumération de comptes par timing.
        const user = await db.query.users.findFirst({
          where: and(eq(users.email, email), isNull(users.deletedAt)),
        });

        const dummyHash =
          "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$WGnRxRZBmBwl3nO0lE0uHf9d1qazNcyzS4qGl0k5Uek";
        const isValid = await verifyPassword(
          user?.passwordHash ?? dummyHash,
          password
        );

        if (!user || !isValid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
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
});
