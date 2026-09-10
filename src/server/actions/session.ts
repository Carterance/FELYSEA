"use server";

import { db } from "@/db";
import {
  weeklySessions,
  partnerAnswers,
  eveningPlans,
} from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { auth } from "@/auth";
import { getUserCoupleId, assertSessionAccess } from "@/server/authorization";
import { isoWeekMonday } from "@/lib/week";
import { partnerAnswerSchema } from "@/lib/validation";
import { computeEveningPlan } from "@/lib/matching";
import type { ActionResult } from "./couple";

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  return session.user.id;
}

/** Récupère la session de la semaine en cours pour le couple, en la créant si besoin. */
export async function getOrCreateCurrentSession(): Promise<
  ActionResult<{ sessionId: string; chosenDay: string | null; status: string }>
> {
  const userId = await requireUserId();
  const coupleId = await getUserCoupleId(userId);
  if (!coupleId) return { success: false, error: "Vous ne faites partie d'aucun couple." };

  const weekOf = isoWeekMonday();

  let session = await db.query.weeklySessions.findFirst({
    where: and(eq(weeklySessions.coupleId, coupleId), eq(weeklySessions.weekOf, weekOf)),
  });

  if (!session) {
    const [created] = await db
      .insert(weeklySessions)
      .values({ coupleId, weekOf })
      .returning();
    session = created;
  }

  return {
    success: true,
    data: { sessionId: session.id, chosenDay: session.chosenDay, status: session.status },
  };
}

/** Confirme le jour retenu pour la soirée de la semaine. */
export async function chooseDay(sessionId: string, day: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await assertSessionAccess(userId, sessionId);

  await db.update(weeklySessions).set({ chosenDay: day }).where(eq(weeklySessions.id, sessionId));

  return { success: true, data: undefined };
}

/** Soumet (ou met à jour) la réponse au questionnaire d'un partenaire pour une session. */
export async function submitAnswer(input: unknown): Promise<ActionResult<{ ready: boolean }>> {
  const userId = await requireUserId();

  const parsed = partnerAnswerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { sessionId, ...answer } = parsed.data;
  const session = await assertSessionAccess(userId, sessionId);

  const existing = await db.query.partnerAnswers.findFirst({
    where: and(eq(partnerAnswers.sessionId, sessionId), eq(partnerAnswers.userId, userId)),
  });

  if (existing) {
    await db
      .update(partnerAnswers)
      .set({ ...answer, submittedAt: new Date() })
      .where(eq(partnerAnswers.id, existing.id));
  } else {
    await db.insert(partnerAnswers).values({ sessionId, userId, ...answer });
  }

  const allAnswers = await db.query.partnerAnswers.findMany({
    where: eq(partnerAnswers.sessionId, sessionId),
  });

  // On ne déclenche le matching que lorsque les DEUX partenaires ont répondu
  if (allAnswers.length >= 2) {
    await generateEveningPlanIfNeeded(sessionId, session.coupleId, allAnswers);
    await db
      .update(weeklySessions)
      .set({ status: "ready" })
      .where(eq(weeklySessions.id, sessionId));
    return { success: true, data: { ready: true } };
  }

  return { success: true, data: { ready: false } };
}

async function generateEveningPlanIfNeeded(
  sessionId: string,
  coupleId: string,
  allAnswers: Array<typeof partnerAnswers.$inferSelect>
) {
  const existingPlan = await db.query.eveningPlans.findFirst({
    where: eq(eveningPlans.sessionId, sessionId),
  });
  if (existingPlan) return;

  // Anti-répétition : mood des 2 dernières soirées de ce couple
  const recentSessions = await db.query.weeklySessions.findMany({
    where: eq(weeklySessions.coupleId, coupleId),
    orderBy: desc(weeklySessions.weekOf),
    limit: 3,
    with: { plan: true },
  });
  const recentMoods = recentSessions.map((s) => s.plan?.mood).filter((m): m is string => Boolean(m));

  const [a, b] = allAnswers;
  const plan = computeEveningPlan(a, b, recentMoods);

  await db.insert(eveningPlans).values({ sessionId, ...plan });
}

/** Marque la session comme révélée (déclenche l'affichage côté UI pour les deux). */
export async function markRevealed(sessionId: string): Promise<ActionResult> {
  const userId = await requireUserId();
  await assertSessionAccess(userId, sessionId);

  await db
    .update(weeklySessions)
    .set({ status: "revealed", revealedAt: new Date() })
    .where(eq(weeklySessions.id, sessionId));

  return { success: true, data: undefined };
}
