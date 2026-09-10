"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, Input, PrimaryButton } from "@/components/ui";
import { createCouple, joinCouple } from "@/server/actions/couple";

export function CoupleOnboarding() {
  const [mode, setMode] = useState<"choose" | "created" | "join">("choose");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const router = useRouter();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createCouple({});
      if (!result.success) {
        setError(result.error);
        return;
      }
      setInviteCode(result.data.inviteCode);
      setMode("created");
    });
  }

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await joinCouple({ code: joinCode });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/");
    });
  }

  if (mode === "created" && inviteCode) {
    return (
      <div className="flex flex-col gap-6 text-center">
        <p className="text-foreground-muted">
          Partagez ce code avec votre partenaire pour qu&apos;iel puisse
          rejoindre votre espace.
        </p>
        <p className="rounded-md border border-border-strong bg-background px-6 py-4 font-display text-3xl tracking-[0.15em] text-accent">
          {inviteCode}
        </p>
        <p className="text-sm text-foreground-muted">
          Ce code expire dans 7 jours.
        </p>
        <PrimaryButton onClick={() => router.push("/")}>
          Continuer
        </PrimaryButton>
      </div>
    );
  }

  if (mode === "join") {
    return (
      <form onSubmit={handleJoin} className="flex flex-col gap-5">
        <Field label="Code d'invitation" htmlFor="code" error={error ?? undefined}>
          <Input
            id="code"
            required
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Ex. A3F7K9PQ"
            className="uppercase tracking-widest"
          />
        </Field>
        <PrimaryButton type="submit" disabled={isPending}>
          {isPending ? "Vérification..." : "Rejoindre"}
        </PrimaryButton>
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="text-sm text-foreground-muted hover:text-foreground"
        >
          Retour
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-danger">{error}</p>}
      <PrimaryButton onClick={handleCreate} disabled={isPending}>
        {isPending ? "Création..." : "Créer notre espace"}
      </PrimaryButton>
      <button
        type="button"
        onClick={() => setMode("join")}
        className="w-full rounded-md border border-border px-4 py-2.5 text-foreground transition-colors hover:border-accent"
      >
        J&apos;ai un code d&apos;invitation
      </button>
    </div>
  );
}
