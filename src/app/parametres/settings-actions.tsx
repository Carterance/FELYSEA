"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMyAccount, deleteCoupleData } from "@/server/actions/account";

export function SettingsActions() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState<"account" | "couple" | null>(null);

  function handleDeleteAccount() {
    if (confirming !== "account") {
      setConfirming("account");
      return;
    }
    startTransition(async () => {
      await deleteMyAccount();
      router.push("/connexion");
    });
  }

  function handleDeleteCouple() {
    if (confirming !== "couple") {
      setConfirming("couple");
      return;
    }
    startTransition(async () => {
      await deleteCoupleData();
      router.push("/bienvenue");
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-border p-5">
        <p className="text-sm text-foreground">Supprimer toutes les données du couple</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Toutes les sessions, réponses, journaux et badges du couple seront
          définitivement supprimés. Action irréversible.
        </p>
        <button
          onClick={handleDeleteCouple}
          disabled={isPending}
          className="mt-3 rounded-md border border-danger px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
        >
          {confirming === "couple" ? "Confirmer la suppression" : "Supprimer les données du couple"}
        </button>
      </div>

      <div className="rounded-lg border border-border p-5">
        <p className="text-sm text-foreground">Supprimer mon compte</p>
        <p className="mt-1 text-xs text-foreground-muted">
          Votre compte sera anonymisé et vous serez déconnecté. Action irréversible.
        </p>
        <button
          onClick={handleDeleteAccount}
          disabled={isPending}
          className="mt-3 rounded-md border border-danger px-4 py-2 text-sm text-danger transition-colors hover:bg-danger/10"
        >
          {confirming === "account" ? "Confirmer la suppression" : "Supprimer mon compte"}
        </button>
      </div>
    </div>
  );
}
