import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { weeklySessions, coupleMembers, users, notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { sendReminderEmail, sendDayOfEmail, sendFollowUpEmail } from "@/lib/email";

/**
 * Déclenchée une fois par jour par le workflow GitHub Actions
 * .github/workflows/notifications-cron.yml (Render n'a pas de Cron Job
 * gratuit). Protégée par un secret partagé (CRON_SECRET, identique côté
 * Render et dans le secret GitHub Actions du même nom) pour empêcher tout
 * appel externe non autorisé.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const allSessions = await db.query.weeklySessions.findMany({
    where: eq(weeklySessions.status, "ready"),
  });

  let sent = 0;

  for (const session of allSessions) {
    if (!session.chosenDay) continue;

    const chosen = new Date(`${session.chosenDay}T00:00:00`);
    const diffDays = Math.round((chosen.getTime() - today.getTime()) / 86_400_000);

    let type: "reminder" | "day_of" | null = null;
    if (diffDays === 2) type = "reminder";
    if (diffDays === 0) type = "day_of";
    if (!type) continue;

    const members = await db.query.coupleMembers.findMany({
      where: eq(coupleMembers.coupleId, session.coupleId),
    });

    for (const member of members) {
      const alreadySent = await db.query.notifications.findFirst({
        where: and(eq(notifications.userId, member.userId), eq(notifications.type, type)),
      });
      // Note: cette vérification est volontairement simple pour le MVP (un
      // seul rappel de ce type par utilisateur, jamais réenvoyé). Pour un
      // vrai cycle hebdomadaire récurrent, ajouter sessionId sur `notifications`.
      if (alreadySent) continue;

      const user = await db.query.users.findFirst({ where: eq(users.id, member.userId) });
      if (!user) continue;

      if (type === "reminder") await sendReminderEmail(user.email, user.name);
      if (type === "day_of") await sendDayOfEmail(user.email, user.name);

      await db.insert(notifications).values({ userId: user.id, type, channel: "email", sentAt: new Date() });
      sent += 1;
    }
  }

  // Suivi post-soirée : sessions complétées hier
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const completedSessions = await db.query.weeklySessions.findMany({
    where: eq(weeklySessions.status, "completed"),
  });

  for (const session of completedSessions) {
    if (session.chosenDay !== yesterday.toISOString().slice(0, 10)) continue;

    const members = await db.query.coupleMembers.findMany({
      where: eq(coupleMembers.coupleId, session.coupleId),
    });

    for (const member of members) {
      const alreadySent = await db.query.notifications.findFirst({
        where: and(eq(notifications.userId, member.userId), eq(notifications.type, "follow_up")),
      });
      if (alreadySent) continue;

      const user = await db.query.users.findFirst({ where: eq(users.id, member.userId) });
      if (!user) continue;

      await sendFollowUpEmail(user.email, user.name);
      await db.insert(notifications).values({ userId: user.id, type: "follow_up", channel: "email", sentAt: new Date() });
      sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
