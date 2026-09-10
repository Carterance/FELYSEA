import "dotenv/config";
import { db } from "../src/db";
import { users, couples, coupleMembers, weeklySessions, partnerAnswers, eveningPlans } from "../src/db/schema";
import { hashPassword } from "../src/lib/password";
import { computeEveningPlan } from "../src/lib/matching";
import { isoWeekMonday } from "../src/lib/week";

async function main() {
  console.log("Seed : création d'un couple de démonstration...");

  const passwordHash = await hashPassword("motdepasse-demo-123");

  const [alice] = await db
    .insert(users)
    .values({ name: "Alice", email: "alice@demo.local", passwordHash })
    .returning();
  const [ben] = await db
    .insert(users)
    .values({ name: "Ben", email: "ben@demo.local", passwordHash })
    .returning();

  const [couple] = await db.insert(couples).values({ name: "Alice & Ben" }).returning();

  await db.insert(coupleMembers).values([
    { userId: alice.id, coupleId: couple.id },
    { userId: ben.id, coupleId: couple.id },
  ]);

  const weekOf = isoWeekMonday();
  const [session] = await db
    .insert(weeklySessions)
    .values({ coupleId: couple.id, weekOf, status: "ready" })
    .returning();

  const aliceAnswer = {
    moods: ["romance", "douceur"],
    energyLevel: 3,
    noveltySeek: 3,
    intensity: "sensual" as const,
    preferences: ["Massage"],
    optOut: false,
  };
  const benAnswer = {
    moods: ["romance", "jeu"],
    energyLevel: 4,
    noveltySeek: 4,
    intensity: "sensual" as const,
    preferences: ["Quelque chose de nouveau"],
    optOut: false,
  };

  await db.insert(partnerAnswers).values([
    { sessionId: session.id, userId: alice.id, ...aliceAnswer },
    { sessionId: session.id, userId: ben.id, ...benAnswer },
  ]);

  const plan = computeEveningPlan(aliceAnswer, benAnswer);
  await db.insert(eveningPlans).values({ sessionId: session.id, ...plan });

  console.log("✅ Seed terminé.");
  console.log("   Compte 1 : alice@demo.local / motdepasse-demo-123");
  console.log("   Compte 2 : ben@demo.local / motdepasse-demo-123");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
