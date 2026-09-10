import { db } from "@/db";
import { coupleMembers, weeklySessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * RÈGLE DE SÉCURITÉ CENTRALE DU PROJET
 * ────────────────────────────────────
 * Aucune query ne doit jamais lire/écrire des données d'un couple sans
 * passer par une des fonctions ci-dessous. Ne jamais faire de requête
 * directe sur weeklySessions / partnerAnswers / journalEntries etc. à
 * partir d'un id fourni par le client sans vérifier l'appartenance.
 */

export class ForbiddenError extends Error {
  constructor(message = "Accès refusé") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** Renvoie l'id du couple de l'utilisateur, ou null s'il n'en a pas / n'existe pas. */
export async function getUserCoupleId(userId: string): Promise<string | null> {
  const membership = await db.query.coupleMembers.findFirst({
    where: eq(coupleMembers.userId, userId),
  });
  return membership?.coupleId ?? null;
}

/** Lève ForbiddenError si l'utilisateur n'appartient pas au couple donné. */
export async function assertCoupleMembership(
  userId: string,
  coupleId: string
): Promise<void> {
  const membership = await db.query.coupleMembers.findFirst({
    where: and(
      eq(coupleMembers.userId, userId),
      eq(coupleMembers.coupleId, coupleId)
    ),
  });
  if (!membership) {
    throw new ForbiddenError("Vous n'appartenez pas à ce couple.");
  }
}

/**
 * Lève ForbiddenError si l'utilisateur n'a pas le droit d'accéder à cette
 * session hebdomadaire (i.e. n'appartient pas au couple propriétaire).
 * Retourne la session si l'accès est autorisé.
 */
export async function assertSessionAccess(userId: string, sessionId: string) {
  const session = await db.query.weeklySessions.findFirst({
    where: eq(weeklySessions.id, sessionId),
  });
  if (!session) {
    throw new ForbiddenError("Session introuvable.");
  }
  await assertCoupleMembership(userId, session.coupleId);
  return session;
}
