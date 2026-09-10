import { describe, it, expect } from "vitest";
import { isoWeekMonday, daysUntil } from "../week";

describe("isoWeekMonday", () => {
  it("renvoie le lundi lorsqu'on est un mercredi", () => {
    // mercredi 9 septembre 2026
    const monday = isoWeekMonday(new Date("2026-09-09T12:00:00Z"));
    expect(monday).toBe("2026-09-07");
  });

  it("renvoie le même lundi lorsqu'on est déjà lundi", () => {
    const monday = isoWeekMonday(new Date("2026-09-07T12:00:00Z"));
    expect(monday).toBe("2026-09-07");
  });

  it("gère correctement le dimanche (dernier jour de la semaine ISO)", () => {
    const monday = isoWeekMonday(new Date("2026-09-13T12:00:00Z"));
    expect(monday).toBe("2026-09-07");
  });

  it("reste stable au changement de mois", () => {
    // dimanche 1er mars 2026 appartient à la semaine du lundi 23 février
    const monday = isoWeekMonday(new Date("2026-03-01T12:00:00Z"));
    expect(monday).toBe("2026-02-23");
  });
});

describe("daysUntil", () => {
  it("renvoie 0 pour aujourd'hui", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(daysUntil(today)).toBe(0);
  });
});
