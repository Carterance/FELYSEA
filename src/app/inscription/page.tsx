import Link from "next/link";
import { RitualPanel } from "@/components/ui";
import { RegisterForm } from "./register-form";

export default function InscriptionPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="font-display text-3xl text-foreground">
            Bienvenue dans votre espace à deux
          </h1>
          <p className="mt-2 text-foreground-muted">
            Créez votre profil pour commencer.
          </p>
        </div>
        <RitualPanel>
          <RegisterForm />
        </RitualPanel>
        <p className="text-sm text-foreground-muted">
          Déjà un compte ?{" "}
          <Link href="/connexion" className="text-accent hover:text-accent-strong">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}
