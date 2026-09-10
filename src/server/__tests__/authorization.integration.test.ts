import { describe, it, expect, beforeAll } from "vitest";
import { eq } from "drizzle-orm";

/**
 * Ces tests vérifient la règle de sécurité la plus critique du projet :
 * un utilisateur ne peut JAMAIS accéder aux données d'un couple dont il ne
 * fait pas partie. Ils nécessitent une vraie base Postgres de test (jamais
 * la base de production) — ils sont automatiquement ignorés si
 * DATABASE_URL n'est pas définie, ce qui est le cas dans ce sandbox.
 *
 * Pour les exécuter en local : renseigner DATABASE_URL vers une base de
 * test dédiée, `npx drizzle-kit push`, puis `npm run test`.
 */
const hasDb = Boolean(process.env.DATABASE_URL);

describe.skipIf(!hasDb)("isolation des couples", () => {
  let db: typeof import("../../db").db;
  let schema: typeof import("../../db/schema");
  let authz: typeof import("../authorization");

  beforeAll(async () => {
    ({ db } = await import("../../db"));
    schema = await import("../../db/schema");
    authz = await import("../authorization");
  });

  it("refuse l'accès à la session d'un autre couple", async () => {
    const [userA] = await db
      .insert(schema.users)
      .values({ email: `a-${Date.now()}@test.local`, passwordHash: "x", name: "A" })
      .returning();
    const [userB] = await db
      .insert(schema.users)
      .values({ email: `b-${Date.now()}@test.local`, passwordHash: "x", name: "B" })
      .returning();

    const [coupleB] = await db.insert(schema.couples).values({}).returning();
    await db.insert(schema.coupleMembers).values({ userId: userB.id, coupleId: coupleB.id });

    const [sessionB] = await db
      .insert(schema.weeklySessions)
      .values({ coupleId: coupleB.id, weekOf: "2026-01-05" })
      .returning();

    await expect(authz.assertSessionAccess(userA.id, sessionB.id)).rejects.toThrow(
      authz.ForbiddenError
    );

    // Nettoyage
    await db.delete(schema.couples).where(eq(schema.couples.id, coupleB.id));
    await db.delete(schema.users).where(eq(schema.users.id, userA.id));
    await db.delete(schema.users).where(eq(schema.users.id, userB.id));
  });

  it("autorise l'accès à sa propre session de couple", async () => {
    const [user] = await db
      .insert(schema.users)
      .values({ email: `c-${Date.now()}@test.local`, passwordHash: "x", name: "C" })
      .returning();
    const [couple] = await db.insert(schema.couples).values({}).returning();
    await db.insert(schema.coupleMembers).values({ userId: user.id, coupleId: couple.id });
    const [session] = await db
      .insert(schema.weeklySessions)
      .values({ coupleId: couple.id, weekOf: "2026-01-05" })
      .returning();

    const result = await authz.assertSessionAccess(user.id, session.id);
    expect(result.id).toBe(session.id);

    await db.delete(schema.couples).where(eq(schema.couples.id, couple.id));
    await db.delete(schema.users).where(eq(schema.users.id, user.id));
  });
});
