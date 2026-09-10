"use client";

import { useState } from "react";
import { PrimaryButton } from "@/components/ui";
import type { eveningPlans } from "@/db/schema";

type Plan = typeof eveningPlans.$inferSelect;

const MOOD_EMOJI: Record<string, string> = {
  douceur: "🌙",
  romance: "❤️",
  jeu: "🎲",
  aventure: "💫",
  nouveaute: "✨",
  intensite: "🔥",
};

export function RevealScreen({ plan }: { plan: Plan; sessionId: string }) {
  const [step, setStep] = useState<"waiting" | "revealed">("waiting");

  if (step === "waiting") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <p className="font-display text-2xl text-foreground">Votre soirée est prête.</p>
        <div className="mt-8">
          <PrimaryButton onClick={() => setStep("revealed")}>
            Découvrir notre soirée
          </PrimaryButton>
        </div>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col items-center px-6 py-16 text-center">
      <p className="text-5xl">{MOOD_EMOJI[plan.mood] ?? "✨"}</p>
      <h1 className="mt-4 font-display text-3xl capitalize text-foreground">
        {plan.ambianceLabel}
      </h1>

      <div className="mt-8 w-full max-w-md rounded-lg border border-border bg-surface p-6 text-left">
        <Row label="Musique" value={plan.musicSuggestion} />
        <Row label="Éclairage" value={plan.lightingSuggestion} />
        <Row label="Pour commencer" value={plan.ritual} />
      </div>

      <div className="mt-6 w-full max-w-md rounded-lg border border-border bg-surface p-6 text-left">
        <p className="mb-3 text-sm text-foreground-muted">Idées pour ce soir</p>
        <ul className="flex flex-col gap-2">
          {plan.ideas.map((idea) => (
            <li key={idea} className="text-sm text-foreground">
              · {idea}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 max-w-sm text-sm text-foreground-muted">
        Ces suggestions restent des idées, jamais une obligation — chacun peut
        toujours dire non ou changer d&apos;avis, ce soir comme n&apos;importe
        quel autre soir.
      </p>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs text-foreground-muted">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}
