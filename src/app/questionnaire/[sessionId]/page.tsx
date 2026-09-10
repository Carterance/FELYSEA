import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertSessionAccess } from "@/server/authorization";
import { QuestionnaireForm } from "./questionnaire-form";

export default async function QuestionnairePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  await assertSessionAccess(session.user.id, sessionId);

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-3xl text-foreground">Votre envie, cette semaine</h1>
        <p className="mt-2 text-foreground-muted">
          Vos réponses restent privées jusqu&apos;à ce que vous ayez tous les
          deux répondu.
        </p>
        <div className="mt-8">
          <QuestionnaireForm sessionId={sessionId} />
        </div>
      </div>
    </main>
  );
}
