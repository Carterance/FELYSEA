"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PrimaryButton } from "@/components/ui";
import { chooseDay } from "@/server/actions/session";
import { isoWeekMonday } from "@/lib/week";

function upcomingDays(): { value: string; label: string }[] {
  const monday = new Date(`${isoWeekMonday()}T00:00:00`);
  const labels = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
  return labels.map((label, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return { value: d.toISOString().slice(0, 10), label };
  });
}

export function DayPicker({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const days = upcomingDays();

  function handleConfirm() {
    if (!selected) return;
    startTransition(async () => {
      await chooseDay(sessionId, selected);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-6">
      <p className="text-foreground-muted">
        Quand voulez-vous prendre votre moment à deux cette semaine ?
      </p>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
        {days.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => setSelected(day.value)}
            className={
              "rounded-md border px-2 py-2 text-sm transition-colors " +
              (selected === day.value
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-foreground-muted hover:border-accent-strong")
            }
          >
            {day.label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <PrimaryButton onClick={handleConfirm} disabled={!selected || isPending}>
          {isPending ? "Enregistrement..." : "Confirmer ce jour"}
        </PrimaryButton>
      </div>
    </div>
  );
}
