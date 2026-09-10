"use server";

import { db } from "@/db";
import { users, couples, coupleMembers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { getUserCoupleId } from "@/server/authorization";
import type { ActionResult } from "./couple";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

/**
 * Supprime le compte de l'utilisateur (soft delete + anonymisation des
 * champs identifiants). On garde la ligne pour ne pas casser l'intégrité
 * référentielle des anciennes sessions du couple, mais elle n'est plus
 * consultable ni utilisable pour se connecter.
 */
export async function deleteMyAccount(): Promise<ActionResult> {
  const userId = await requireUserId();

  await db
    .update(users)
    .set({
      email: `deleted-${userId}@deleted.local`,
      passwordHash: "deleted",
      name: "Compte supprimé",
      deletedAt: new Date(),
    })
    .where(eq(users.id, userId));

  await db.delete(coupleMembers).where(eq(coupleMembers.userId, userId));

  await signOut({ redirect: false });

  return { success: true, data: undefined };
}

/**
 * Supprime TOUTES les données du couple (irréversible). Les contraintes
 * `onDelete: cascade` du schéma font le reste : sessions, réponses,
 * journal, badges, invitations disparaissent avec le couple.
 */
export async function deleteCoupleData(): Promise<ActionResult> {
  const userId = await requireUserId();
  const coupleId = await getUserCoupleId(userId);
  if (!coupleId) return { success: false, error: "Vous ne faites partie d'aucun couple." };

  await db.delete(couples).where(eq(couples.id, coupleId));

  return { success: true, data: undefined };
}
