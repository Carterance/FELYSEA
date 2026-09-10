"use server";

import { db } from "@/db";
import { couples, coupleMembers, inviteCodes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { auth } from "@/auth";
import { createCoupleSchema, joinCoupleSchema } from "@/lib/validation";
import { getUserCoupleId } from "@/server/authorization";

// Alphabet sans caractères ambigus (0/O, 1/I/l) pour un code lisible à voix haute
const generateCode = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 8);

export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

/** Crée un couple et génère immédiatement un code d'invitation valable 7 jours. */
export async function createCouple(
  input: unknown
): Promise<ActionResult<{ coupleId: string; inviteCode: string }>> {
  const userId = await requireUserId();

  const existingCoupleId = await getUserCoupleId(userId);
  if (existingCoupleId) {
    return { success: false, error: "Vous faites déjà partie d'un couple." };
  }

  const parsed = createCoupleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Données invalides" };
  }

  const [couple] = await db
    .insert(couples)
    .values({ name: parsed.data.name })
    .returning();

  await db.insert(coupleMembers).values({ userId, coupleId: couple.id });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(inviteCodes).values({
    coupleId: couple.id,
    code,
    expiresAt,
  });

  return { success: true, data: { coupleId: couple.id, inviteCode: code } };
}

/** Rejoint un couple existant via un code d'invitation valide et non utilisé. */
export async function joinCouple(
  input: unknown
): Promise<ActionResult<{ coupleId: string }>> {
  const userId = await requireUserId();

  const existingCoupleId = await getUserCoupleId(userId);
  if (existingCoupleId) {
    return { success: false, error: "Vous faites déjà partie d'un couple." };
  }

  const parsed = joinCoupleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: "Code invalide" };
  }

  const normalizedCode = parsed.data.code.trim().toUpperCase();

  const invite = await db.query.inviteCodes.findFirst({
    where: and(
      eq(inviteCodes.code, normalizedCode),
      eq(inviteCodes.status, "pending"),
      gt(inviteCodes.expiresAt, new Date())
    ),
  });

  if (!invite) {
    return { success: false, error: "Ce code est invalide ou a expiré." };
  }

  // Vérifier que le couple n'a pas déjà 2 membres (sécurité en plus de l'UX)
  const currentMembers = await db.query.coupleMembers.findMany({
    where: eq(coupleMembers.coupleId, invite.coupleId),
  });
  if (currentMembers.length >= 2) {
    return { success: false, error: "Ce couple est déjà complet." };
  }

  await db.transaction(async (tx) => {
    await tx.insert(coupleMembers).values({ userId, coupleId: invite.coupleId });
    await tx
      .update(inviteCodes)
      .set({ status: "used", usedByUserId: userId })
      .where(eq(inviteCodes.id, invite.id));
  });

  return { success: true, data: { coupleId: invite.coupleId } };
}
