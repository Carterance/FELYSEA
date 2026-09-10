import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserCoupleId } from "@/server/authorization";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const coupleId = await getUserCoupleId(session.user.id);
  if (!coupleId) redirect("/bienvenue");

  return (
    <main className="flex flex-1 flex-col px-6 py-16 sm:items-center">
      <div className="w-full max-w-md">
        <p className="text-foreground-muted">Bonjour {session.user.name} ❤️</p>
        <h1 className="mt-2 font-display text-3xl text-foreground">
          Votre prochain moment à deux
        </h1>
        <p className="mt-6 text-foreground-muted">
          Le choix du jour et le questionnaire de la semaine arrivent dans la
          prochaine étape de construction.
        </p>
      </div>
    </main>
  );
}
