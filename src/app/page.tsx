import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserCoupleId } from "@/server/authorization";
import { getOrCreateCurrentSession } from "@/server/actions/session";
import { db } from "@/db";
import { partnerAnswers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { DayPicker } from "./day-picker";
import { PrimaryButton } from "@/components/ui";
import { formatDayFr, daysUntil } from "@/lib/week";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const coupleId = await getUserCoupleId(session.user.id);
  if (!coupleId) redirect("/bienvenue");

  const result = await getOrCreateCurrentSession();
  if (!result.success) redirect("/bienvenue");

  const { sessionId, chosenDay, status } = result.data;

  if (status === "ready" || status === "revealed") redirect(`/soiree/${sessionId}`);

  const myAnswer = await db.query.partnerAnswers.findFirst({
    where: eq(partnerAnswers.sessionId, sessionId),
  });
  const hasAnswered = myAnswer !== undefined;

  return (
    <main className="flex flex-1 flex-col px-6 py-16 sm:items-center">
      <div className="w-full max-w-md">
        <p className="text-foreground-muted">Bonjour {session.user.name} ❤️</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">
          Votre prochain moment à deux
        </h1>

        {chosenDay ? (
          <div className="mt-6 rounded-lg border border-border bg-surface p-6">
            <p className="font-display text-2xl text-accent">{formatDayFr(chosenDay)}</p>
            <p className="mt-1 text-foreground-muted">Dans {daysUntil(chosenDay)} jour(s)</p>
            <div className="mt-5">
              <Link href={`/questionnaire/${sessionId}`}>
                <PrimaryButton>
                  {hasAnswered ? "Modifier mes réponses" : "Préparer notre soirée"}
                </PrimaryButton>
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <DayPicker sessionId={sessionId} />
          </div>
        )}
      </div>
    </main>
  );
}
