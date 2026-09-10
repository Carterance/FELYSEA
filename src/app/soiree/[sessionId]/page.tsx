import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertSessionAccess } from "@/server/authorization";
import { db } from "@/db";
import { partnerAnswers, eveningPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { RevealScreen } from "./reveal-screen";

export default async function SoireePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  await assertSessionAccess(session.user.id, sessionId);

  const answers = await db.query.partnerAnswers.findMany({
    where: eq(partnerAnswers.sessionId, sessionId),
  });

  if (answers.length < 2) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-display text-2xl text-foreground">
          En attente de votre partenaire...
        </p>
        <p className="mt-3 max-w-sm text-foreground-muted">
          Votre réponse est enregistrée. Dès que votre partenaire aura répondu
          à son tour, votre soirée sera prête à être découverte.
        </p>
      </main>
    );
  }

  const plan = await db.query.eveningPlans.findFirst({
    where: eq(eveningPlans.sessionId, sessionId),
  });

  if (!plan) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16 text-center">
        <p className="text-foreground-muted">Préparation de votre soirée...</p>
      </main>
    );
  }

  return <RevealScreen plan={plan} sessionId={sessionId} />;
}
