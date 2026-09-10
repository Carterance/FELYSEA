import Link from "next/link";
import { RitualPanel } from "@/components/ui";
import { LoginForm } from "./login-form";

export default function ConnexionPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="font-display text-3xl text-foreground">
            Retrouvez votre rituel
          </h1>
          <p className="mt-2 text-foreground-muted">
            Connectez-vous à votre espace à deux.
          </p>
        </div>
        <RitualPanel>
          <LoginForm />
        </RitualPanel>
        <p className="text-sm text-foreground-muted">
          Pas encore de compte ?{" "}
          <Link href="/inscription" className="text-accent hover:text-accent-strong">
            En créer un
          </Link>
        </p>
      </div>
    </main>
  );
}
