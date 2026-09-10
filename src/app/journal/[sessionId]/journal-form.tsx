"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui";
import { submitJournalEntry } from "@/server/actions/journal";

const TAGS = [
  "J'ai adoré",
  "J'aimerais recommencer",
  "Envie d'essayer différent la prochaine fois",
  "Plus doux la prochaine fois",
];

export function JournalForm({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [rating, setRating] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [visibility, setVisibility] = useState<"shared" | "private">("private");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitJournalEntry({
        sessionId,
        rating: rating ?? undefined,
        tags,
        note: note || undefined,
        visibility,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <p className="mb-2 text-sm text-foreground-muted">Note</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setRating(n)}
              className={
                "flex h-10 w-10 items-center justify-center rounded-full border text-sm transition-colors " +
                (rating === n
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-foreground-muted hover:border-accent-strong")
              }
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-foreground-muted">Ressenti</p>
        <div className="flex flex-wrap gap-2">
          {TAGS.map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => setTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag])}
              className={
                "rounded-full border px-3 py-1.5 text-sm transition-colors " +
                (tags.includes(tag)
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border text-foreground-muted hover:border-accent-strong")
              }
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-foreground-muted">Note privée (facultatif)</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={1000}
          className="w-full rounded-md border border-border bg-surface px-3.5 py-2.5 text-foreground outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVisibility("private")}
          className={
            "flex-1 rounded-md border px-3 py-2 text-sm transition-colors " +
            (visibility === "private"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-foreground-muted")
          }
        >
          🔒 Privée
        </button>
        <button
          type="button"
          onClick={() => setVisibility("shared")}
          className={
            "flex-1 rounded-md border px-3 py-2 text-sm transition-colors " +
            (visibility === "shared"
              ? "border-accent bg-accent/10 text-accent"
              : "border-border text-foreground-muted")
          }
        >
          ❤️ Partagée
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <PrimaryButton type="submit" disabled={isPending}>
        {isPending ? "Enregistrement..." : "Enregistrer"}
      </PrimaryButton>
    </form>
  );
}
