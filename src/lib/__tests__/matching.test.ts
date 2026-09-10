import { describe, it, expect } from "vitest";
import { computeEveningPlan, suggestCards, type Answer } from "../matching";

function makeAnswer(overrides: Partial<Answer> = {}): Answer {
  return {
    moods: ["romance"],
    energyLevel: 3,
    noveltySeek: 3,
    intensity: "sensual",
    preferences: [],
    optOut: false,
    ...overrides,
  };
}

describe("computeEveningPlan", () => {
  it("retient toujours l'intensité la plus basse des deux, jamais la plus haute", () => {
    const a = makeAnswer({ intensity: "very_intense" });
    const b = makeAnswer({ intensity: "soft" });
    const plan = computeEveningPlan(a, b);
    expect(plan.intensity).toBe("soft");
  });

  it("est symétrique : peu importe l'ordre des partenaires", () => {
    const a = makeAnswer({ intensity: "intense" });
    const b = makeAnswer({ intensity: "sensual" });
    const plan1 = computeEveningPlan(a, b);
    const plan2 = computeEveningPlan(b, a);
    expect(plan1.intensity).toBe(plan2.intensity);
    expect(plan1.intensity).toBe("sensual");
  });

  it("respecte un opt-out de n'importe quel partenaire, même si l'autre est partant", () => {
    const a = makeAnswer({ optOut: true, intensity: "very_intense" });
    const b = makeAnswer({ intensity: "very_intense" });
    const plan = computeEveningPlan(a, b);
    expect(plan.mood).toBe("douceur");
    expect(plan.intensity).toBe("soft");
  });

  it("priorise les moods partagés par les deux partenaires", () => {
    const a = makeAnswer({ moods: ["romance", "jeu"] });
    const b = makeAnswer({ moods: ["jeu", "aventure"] });
    const plan = computeEveningPlan(a, b);
    expect(plan.mood).toBe("jeu");
  });

  it("retombe sur l'union des moods si aucun mood n'est partagé", () => {
    const a = makeAnswer({ moods: ["romance"] });
    const b = makeAnswer({ moods: ["jeu"] });
    const plan = computeEveningPlan(a, b);
    expect(["romance", "jeu"]).toContain(plan.mood);
  });

  it("évite de reproposer un mood récent si une alternative existe", () => {
    const a = makeAnswer({ moods: ["romance", "jeu"] });
    const b = makeAnswer({ moods: ["romance", "jeu"] });
    const plan = computeEveningPlan(a, b, ["romance"]);
    expect(plan.mood).toBe("jeu");
  });

  it("moyenne le niveau de nouveauté", () => {
    const a = makeAnswer({ noveltySeek: 5 });
    const b = makeAnswer({ noveltySeek: 1 });
    const plan = computeEveningPlan(a, b);
    // novelty=3 -> éclairage intermédiaire
    expect(plan.lightingSuggestion).toBeTruthy();
  });

  it("ne plante jamais si un partenaire n'a aucun mood sélectionné", () => {
    const a = makeAnswer({ moods: [] });
    const b = makeAnswer({ moods: ["romance"] });
    expect(() => computeEveningPlan(a, b)).not.toThrow();
  });
});

describe("suggestCards", () => {
  it("renvoie toujours 3 cartes pour un mood connu", () => {
    const a = makeAnswer({ moods: ["romance"] });
    const b = makeAnswer({ moods: ["romance"] });
    const plan = computeEveningPlan(a, b);
    expect(suggestCards(plan)).toHaveLength(3);
  });

  it("évite les cartes récentes si une alternative existe", () => {
    const a = makeAnswer({ moods: ["romance"] });
    const b = makeAnswer({ moods: ["romance"] });
    const plan = computeEveningPlan(a, b);
    const cards = suggestCards(plan, ["romance"]);
    expect(cards.map((c) => c.id)).not.toContain("romance");
  });
});
