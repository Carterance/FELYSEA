"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";
import { rateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export type RegisterResult =
  | { success: true }
  | { success: false; error: string };

export async function registerUser(input: unknown): Promise<RegisterResult> {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`register:${ip}`, { max: 5, windowMs: 60_000 });
  if (!limit.allowed) {
    return { success: false, error: "Trop de tentatives. Réessayez dans une minute." };
  }

  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { name, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (existing) {
    // Message volontairement générique pour ne pas confirmer l'existence
    // d'un compte à un attaquant (énumération d'emails).
    return {
      success: false,
      error: "Impossible de créer ce compte. Vérifiez vos informations ou connectez-vous.",
    };
  }

  const passwordHash = await hashPassword(password);

  await db.insert(users).values({ name, email, passwordHash });

  return { success: true };
}
