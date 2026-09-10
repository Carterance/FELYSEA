import { describe, it, expect } from "vitest";
import { rateLimit } from "../rate-limit";
import { hashPassword, verifyPassword } from "../password";

describe("rateLimit", () => {
  it("autorise jusqu'à la limite puis bloque", () => {
    const key = `test-${Date.now()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, { max: 3, windowMs: 1000 }).allowed).toBe(true);
    }
    expect(rateLimit(key, { max: 3, windowMs: 1000 }).allowed).toBe(false);
  });

  it("traite des clés différentes indépendamment", () => {
    const keyA = `a-${Date.now()}`;
    const keyB = `b-${Date.now()}`;
    rateLimit(keyA, { max: 1, windowMs: 1000 });
    expect(rateLimit(keyA, { max: 1, windowMs: 1000 }).allowed).toBe(false);
    expect(rateLimit(keyB, { max: 1, windowMs: 1000 }).allowed).toBe(true);
  });
});

describe("password hashing", () => {
  it("vérifie un mot de passe correct", async () => {
    const hash = await hashPassword("un-mot-de-passe-solide-42");
    expect(await verifyPassword(hash, "un-mot-de-passe-solide-42")).toBe(true);
  });

  it("rejette un mot de passe incorrect", async () => {
    const hash = await hashPassword("un-mot-de-passe-solide-42");
    expect(await verifyPassword(hash, "mauvais-mot-de-passe")).toBe(false);
  });

  it("ne lève jamais d'exception sur un hash corrompu", async () => {
    await expect(verifyPassword("pas-un-hash-valide", "quoi-que-ce-soit")).resolves.toBe(false);
  });
});
