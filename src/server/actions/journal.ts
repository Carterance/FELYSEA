"use server";

import { db } from "@/db";
import { journalEntries, weeklySessions, badges, coupleMembers } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { assertSessionAccess, getUserCoupleId } from "@/server/authorization";
import { z } from "zod";
import type { ActionResult } from "./couple";

const journalSchema = z.object({
  sessionId: z.string().uuid(),
  rating: z.number().int().min(1).max(5).optional(),
  tags: z.array(z.string()).max(10).default([]),
  note: z.string().max(1000).optional(),
  visibility: z.enum(["shared", "private"]).default("private"),
});

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

/** Enregistre (ou met à jour) l'entrée de journal de l'utilisateur pour une session. */
export async function submitJournalEntry(input: unknown): Promise<ActionResult> {
  const userId = await requireUserId();
  const parsed = journalSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { sessionId, ...entry } = parsed.data;
  const session = await assertSessionAccess(userId, sessionId);

  const existing = await db.query.journalEntries.findFirst({
    where: and(eq(journalEntries.sessionId, sessionId), eq(journalEntries.userId, userId)),
  });

  if (existing) {
    await db.update(journalEntries).set(entry).where(eq(journalEntries.id, existing.id));
  } else {
    await db.insert(journalEntries).values({ sessionId, userId, ...entry });
  }

  await db.update(weeklySessions).set({ status: "completed" }).where(eq(weeklySessions.id, sessionId));

  await maybeUnlockBadges(session.coupleId);

  return { success: true, data: undefined };
}

/**
 * Débloque des badges positifs selon le nombre de soirées complétées.
 * Volontairement non compétitif : on ne compare jamais à d'autres couples,
 * seulement au propre historique du couple.
 */
async function maybeUnlockBadges(coupleId: string) {
  const completedSessions = await db.query.weeklySessions.findMany({
    where: and(eq(weeklySessions.coupleId, coupleId), eq(weeklySessions.status, "completed")),
  });
  const count = completedSessions.length;

  const milestones: Record<number, string> = {
    1: "first_evening",
    5: "five_evenings",
    10: "ten_evenings",
  };
  const type = milestones[count];
  if (!type) return;

  const existing = await db.query.badges.findFirst({
    where: and(eq(badges.coupleId, coupleId), eq(badges.type, type)),
  });
  if (!existing) {
    await db.insert(badges).values({ coupleId, type });
  }
}

/** Renvoie les entrées de journal visibles par l'utilisateur pour une session (la sienne + celle du partenaire si partagée). */
export async function getJournalEntries(sessionId: string) {
  const userId = await requireUserId();
  await assertSessionAccess(userId, sessionId);

  const entries = await db.query.journalEntries.findMany({
    where: eq(journalEntries.sessionId, sessionId),
  });

  return entries.filter((e) => e.userId === userId || e.visibility === "shared");
}
