import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getMyBoundaries } from "@/server/actions/boundaries";
import { BoundariesManager } from "./boundaries-manager";

export default async function LimitesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const boundaries = await getMyBoundaries();

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-3xl text-foreground">Vos limites</h1>
        <p className="mt-2 text-foreground-muted">
          Strictement privé — jamais visible par votre partenaire, ni utilisé
          pour composer vos soirées. Un simple aide-mémoire personnel. Rien
          ici ne vaut consentement pour une prochaine fois : chaque moment
          reste à décider dans l&apos;instant.
        </p>
        <div className="mt-8">
          <BoundariesManager initialBoundaries={boundaries} />
        </div>
      </div>
    </main>
  );
}
