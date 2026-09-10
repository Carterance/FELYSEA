import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { assertSessionAccess } from "@/server/authorization";
import { JournalForm } from "./journal-form";

export default async function JournalPage({
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
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-foreground">Comment était votre soirée ?</h1>
        <p className="mt-2 text-foreground-muted">
          Vous choisissez si cette note est partagée avec votre partenaire ou
          gardée pour vous.
        </p>
        <div className="mt-8">
          <JournalForm sessionId={sessionId} />
        </div>
      </div>
    </main>
  );
}
