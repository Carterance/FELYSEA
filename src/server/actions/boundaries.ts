"use server";

import { db } from "@/db";
import { boundaries } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { boundarySchema } from "@/lib/validation";
import type { ActionResult } from "./couple";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

/** Ajoute une limite personnelle. Toujours strictement privée à son auteur. */
export async function addBoundary(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = boundarySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  await db.insert(boundaries).values({ userId, ...parsed.data });
  return { success: true, data: undefined };
}

/** Renvoie uniquement les limites de l'utilisateur courant — jamais celles du partenaire. */
export async function getMyBoundaries() {
  const userId = await requireUserId();
  return db.query.boundaries.findMany({ where: eq(boundaries.userId, userId) });
}

export async function deleteBoundary(boundaryId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await db.delete(boundaries).where(and(eq(boundaries.id, boundaryId), eq(boundaries.userId, userId)));
  return { success: true, data: undefined };
}
