import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserCoupleId } from "@/server/authorization";
import { RitualPanel } from "@/components/ui";
import { CoupleOnboarding } from "./couple-onboarding";

export default async function BienvenuePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  const existingCoupleId = await getUserCoupleId(session.user.id);
  if (existingCoupleId) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="font-display text-3xl text-foreground">
            Votre espace à deux
          </h1>
          <p className="mt-2 text-foreground-muted">
            Créez votre couple, ou rejoignez celui de votre partenaire.
          </p>
        </div>
        <RitualPanel>
          <CoupleOnboarding />
        </RitualPanel>
      </div>
    </main>
  );
}
