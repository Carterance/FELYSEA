import Link from "next/link";
import { auth, signOut } from "@/auth";

export async function SiteHeader() {
  const session = await auth();
  if (!session?.user) return null;

  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-4">
      <Link href="/" className="font-display text-lg text-foreground">
        Notre rituel
      </Link>
      <nav className="flex items-center gap-5 text-sm text-foreground-muted">
        <Link href="/limites" className="hover:text-foreground">
          Vos limites
        </Link>
        <Link href="/parametres" className="hover:text-foreground">
          Confidentialité
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/connexion" });
          }}
        >
          <button type="submit" className="hover:text-foreground">
            Se déconnecter
          </button>
        </form>
      </nav>
    </header>
  );
}
