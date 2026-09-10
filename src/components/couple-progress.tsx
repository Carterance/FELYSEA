import { db } from "@/db";
import { badges as badgesTable, weeklySessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";

const BADGE_LABELS: Record<string, string> = {
  first_evening: "Première soirée",
  five_evenings: "5 rendez-vous",
  ten_evenings: "10 rendez-vous",
};

export async function CoupleProgress({ coupleId }: { coupleId: string }) {
  const [completedSessions, unlockedBadges] = await Promise.all([
    db.query.weeklySessions.findMany({
      where: and(eq(weeklySessions.coupleId, coupleId), eq(weeklySessions.status, "completed")),
    }),
    db.query.badges.findMany({ where: eq(badgesTable.coupleId, coupleId) }),
  ]);

  if (completedSessions.length === 0) return null;

  return (
    <div className="mt-6 rounded-lg border border-border bg-surface p-6">
      <p className="text-sm text-foreground-muted">Notre histoire</p>
      <p className="mt-1 font-display text-xl text-foreground">
        {completedSessions.length} soirée{completedSessions.length > 1 ? "s" : ""} ensemble
      </p>
      {unlockedBadges.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {unlockedBadges.map((b) => (
            <span
              key={b.id}
              className="rounded-full border border-border-strong bg-accent/10 px-3 py-1 text-xs text-accent"
            >
              {BADGE_LABELS[b.type] ?? b.type}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
