"use client";

import { useState, useTransition } from "react";
import { addBoundary, deleteBoundary } from "@/server/actions/boundaries";
import type { boundaries as boundariesTable } from "@/db/schema";

type Boundary = typeof boundariesTable.$inferSelect;

const CATEGORIES: { value: Boundary["category"]; label: string; hint: string }[] = [
  { value: "love", label: "Ce que j'aime", hint: "" },
  { value: "curious", label: "Ce que je pourrais avoir envie d'essayer", hint: "" },
  { value: "avoid", label: "Ce que je préfère éviter", hint: "" },
  { value: "hard_limit", label: "Complètement hors limites", hint: "Jamais lu par le matching" },
];

export function BoundariesManager({ initialBoundaries }: { initialBoundaries: Boundary[] }) {
  const [items, setItems] = useState(initialBoundaries);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function handleAdd(category: Boundary["category"]) {
    const label = drafts[category]?.trim();
    if (!label) return;

    startTransition(async () => {
      const result = await addBoundary({ category, label });
      if (result.success) {
        setItems((prev) => [
          ...prev,
          { id: crypto.randomUUID(), userId: "", category, label, createdAt: new Date(), updatedAt: new Date() },
        ]);
        setDrafts((d) => ({ ...d, [category]: "" }));
      }
    });
  }

  function handleDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    startTransition(() => {
      void deleteBoundary(id);
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {CATEGORIES.map((cat) => (
        <div key={cat.value}>
          <p className="text-sm text-foreground">{cat.label}</p>
          {cat.hint && <p className="text-xs text-foreground-muted">{cat.hint}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {items
              .filter((i) => i.category === cat.value)
              .map((i) => (
                <span
                  key={i.id}
                  className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground"
                >
                  {i.label}
                  <button
                    onClick={() => handleDelete(i.id)}
                    aria-label={`Supprimer ${i.label}`}
                    className="text-foreground-muted hover:text-danger"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={drafts[cat.value] ?? ""}
              onChange={(e) => setDrafts((d) => ({ ...d, [cat.value]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd(cat.value))}
              placeholder="Ajouter..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
            />
            <button
              onClick={() => handleAdd(cat.value)}
              disabled={isPending}
              className="rounded-md border border-border px-3 py-2 text-sm text-foreground-muted hover:border-accent-strong"
            >
              Ajouter
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
