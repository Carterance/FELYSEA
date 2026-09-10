"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui";
import { submitAnswer } from "@/server/actions/session";

const MOODS = [
  { value: "douceur", label: "🌙 Douceur" },
  { value: "romance", label: "❤️ Romance" },
  { value: "jeu", label: "🎲 Jeu" },
  { value: "aventure", label: "💫 Aventure" },
  { value: "nouveaute", label: "✨ Nouveauté" },
  { value: "intensite", label: "🔥 Intensité" },
];

const INTENSITIES = [
  { value: "soft", label: "Soft" },
  { value: "sensual", label: "Sensuel" },
  { value: "intense", label: "Intense" },
  { value: "very_intense", label: "Très intense" },
];

const PREFERENCES = [
  "Câlins prolongés",
  "Massage",
  "Bain ou douche à deux",
  "Jeux de mots doux",
  "Quelque chose de nouveau",
  "Rester simple ce soir",
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export function QuestionnaireForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [moods, setMoods] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState(3);
  const [noveltySeek, setNoveltySeek] = useState(3);
  const [intensity, setIntensity] = useState("sensual");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [optOut, setOptOut] = useState(false);
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitAnswer({
        sessionId,
        moods,
        energyLevel,
        noveltySeek,
        intensity,
        preferences,
        optOut,
        notes: notes || undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/soiree/${sessionId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      <button
        type="button"
        onClick={() => setOptOut(!optOut)}
        className={
          "rounded-md border px-4 py-3 text-left text-sm transition-colors " +
          (optOut ? "border-accent bg-accent/10 text-accent" : "border-border text-foreground-muted")
        }
      >
        {optOut ? "✓ Pas ce soir — je préfère quelque chose de très doux" : "Pas ce soir ?"}
      </button>

      {!optOut && (
        <>
          <div>
            <p className="mb-3 text-sm text-foreground-muted">Ambiance souhaitée</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MOODS.map((m) => (
                <button
                  type="button"
                  key={m.value}
                  onClick={() => setMoods(toggle(moods, m.value))}
                  className={
                    "rounded-md border px-3 py-2 text-sm transition-colors " +
                    (moods.includes(m.value)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-foreground-muted hover:border-accent-strong")
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-foreground-muted">
              Niveau d&apos;énergie : {energyLevel}/5
            </p>
            <input
              type="range"
              min={1}
              max={5}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="w-full accent-[color:var(--accent)]"
            />
          </div>

          <div>
            <p className="mb-2 text-sm text-foreground-muted">
              Envie de nouveauté : {noveltySeek}/5
            </p>
            <input
              type="range"
              min={1}
              max={5}
              value={noveltySeek}
              onChange={(e) => setNoveltySeek(Number(e.target.value))}
              className="w-full accent-[color:var(--accent)]"
            />
          </div>

          <div>
            <p className="mb-3 text-sm text-foreground-muted">Niveau d&apos;intensité souhaité</p>
            <div className="grid grid-cols-2 gap-2">
              {INTENSITIES.map((i) => (
                <button
                  type="button"
                  key={i.value}
                  onClick={() => setIntensity(i.value)}
                  className={
                    "rounded-md border px-3 py-2 text-sm transition-colors " +
                    (intensity === i.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-foreground-muted hover:border-accent-strong")
                  }
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm text-foreground-muted">
              Envies (facultatif — aucune n&apos;est un engagement)
            </p>
            <div className="flex flex-wrap gap-2">
              {PREFERENCES.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPreferences(toggle(preferences, p))}
                  className={
                    "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                    (preferences.includes(p)
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-foreground-muted hover:border-accent-strong")
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-foreground-muted">Une note privée (facultatif)</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={500}
              className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-foreground outline-none focus:border-accent"
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Envoi..." : "Envoyer ma réponse"}
      </PrimaryButton>
    </form>
  );
}
