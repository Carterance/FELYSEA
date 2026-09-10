import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SettingsActions } from "./settings-actions";

export default async function ParametresPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/connexion");

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl text-foreground">Confidentialité</h1>
        <p className="mt-2 text-foreground-muted">
          Vous gardez le contrôle total de vos données.
        </p>
        <div className="mt-8">
          <SettingsActions />
        </div>
      </div>
    </main>
  );
}
