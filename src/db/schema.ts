import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  pgEnum,
  jsonb,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/**
 * ─────────────────────────────────────────────────────────────
 * ENUMS
 * ─────────────────────────────────────────────────────────────
 */

export const sessionStatusEnum = pgEnum("session_status", [
  "collecting", // les deux partenaires n'ont pas encore répondu
  "ready", // les deux ont répondu, résultat pas encore révélé
  "revealed", // le résultat a été affiché
  "completed", // la soirée a eu lieu, journal rempli
  "skipped", // semaine passée sans rituel
]);

export const boundaryCategoryEnum = pgEnum("boundary_category", [
  "love", // ce que j'aime
  "curious", // ce que je pourrais avoir envie d'essayer
  "avoid", // ce que je préfère éviter
  "hard_limit", // hors limites, jamais exposé au partenaire ni au matching
]);

export const journalVisibilityEnum = pgEnum("journal_visibility", [
  "shared",
  "private",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "used",
  "expired",
]);

/**
 * ─────────────────────────────────────────────────────────────
 * IDENTITÉ & COUPLE
 * ─────────────────────────────────────────────────────────────
 */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"), // soft delete pour permettre la suppression de compte
});

export const couples = pgTable("couples", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"), // optionnel, ex: surnom du couple
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deletedAt: timestamp("deleted_at"),
});

// Table de jonction — permet une isolation stricte : toute requête doit
// passer par cette table pour vérifier l'appartenance à un couple.
export const coupleMembers = pgTable(
  "couple_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (table) => ({
    // un utilisateur ne peut appartenir qu'une fois au même couple
    uniqueMembership: uniqueIndex("unique_user_couple").on(
      table.userId,
      table.coupleId
    ),
  })
);

export const inviteCodes = pgTable("invite_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupleId: uuid("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  code: text("code").notNull().unique(),
  status: inviteStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedByUserId: uuid("used_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * ─────────────────────────────────────────────────────────────
 * LIMITES & CONSENTEMENT (strictement privé, jamais lu par le matching
 * pour la catégorie hard_limit)
 * ─────────────────────────────────────────────────────────────
 */

export const boundaries = pgTable("boundaries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  category: boundaryCategoryEnum("category").notNull(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

/**
 * ─────────────────────────────────────────────────────────────
 * RITUEL HEBDOMADAIRE
 * ─────────────────────────────────────────────────────────────
 */

export const weeklySessions = pgTable("weekly_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupleId: uuid("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  weekOf: date("week_of").notNull(), // lundi de la semaine ISO
  chosenDay: date("chosen_day"), // date exacte retenue, null tant que non confirmé
  status: sessionStatusEnum("status").default("collecting").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  revealedAt: timestamp("revealed_at"),
});

// Réponse individuelle au questionnaire — reste invisible au partenaire
// tant que session.status !== 'revealed'
export const partnerAnswers = pgTable(
  "partner_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => weeklySessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moods: jsonb("moods").$type<string[]>().notNull().default([]), // ex: ["romance","douceur"]
    energyLevel: integer("energy_level").notNull(), // 1-5
    noveltySeek: integer("novelty_seek").notNull(), // 1-5
    intensity: text("intensity").notNull(), // "soft" | "sensual" | "intense" | "very_intense"
    preferences: jsonb("preferences").$type<string[]>().notNull().default([]),
    optOut: boolean("opt_out").default(false).notNull(), // "pas ce soir"
    notes: text("notes"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueAnswerPerSession: uniqueIndex("unique_answer_per_session").on(
      table.sessionId,
      table.userId
    ),
  })
);

export const eveningPlans = pgTable("evening_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => weeklySessions.id, { onDelete: "cascade" })
    .unique(),
  mood: text("mood").notNull(),
  intensity: text("intensity").notNull(),
  ambianceLabel: text("ambiance_label").notNull(),
  musicSuggestion: text("music_suggestion"),
  lightingSuggestion: text("lighting_suggestion"),
  ritual: text("ritual"),
  ideas: jsonb("ideas").$type<string[]>().notNull().default([]),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

/**
 * ─────────────────────────────────────────────────────────────
 * JOURNAL, GAMIFICATION, NOTIFICATIONS
 * ─────────────────────────────────────────────────────────────
 */

export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => weeklySessions.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  rating: integer("rating"), // 1-5
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  note: text("note"),
  visibility: journalVisibilityEnum("visibility").default("private").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupleId: uuid("couple_id")
    .notNull()
    .references(() => couples.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // ex: "first_evening", "five_evenings"
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // "reminder" | "day_of" | "follow_up"
  channel: text("channel").default("email").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/**
 * ─────────────────────────────────────────────────────────────
 * RELATIONS (pour les requêtes Drizzle avec `with`)
 * ─────────────────────────────────────────────────────────────
 */

export const usersRelations = relations(users, ({ many }) => ({
  coupleMembers: many(coupleMembers),
  boundaries: many(boundaries),
  journalEntries: many(journalEntries),
}));

export const couplesRelations = relations(couples, ({ many }) => ({
  members: many(coupleMembers),
  sessions: many(weeklySessions),
  inviteCodes: many(inviteCodes),
  badges: many(badges),
}));

export const coupleMembersRelations = relations(coupleMembers, ({ one }) => ({
  user: one(users, { fields: [coupleMembers.userId], references: [users.id] }),
  couple: one(couples, {
    fields: [coupleMembers.coupleId],
    references: [couples.id],
  }),
}));

export const weeklySessionsRelations = relations(
  weeklySessions,
  ({ one, many }) => ({
    couple: one(couples, {
      fields: [weeklySessions.coupleId],
      references: [couples.id],
    }),
    answers: many(partnerAnswers),
    plan: one(eveningPlans, {
      fields: [weeklySessions.id],
      references: [eveningPlans.sessionId],
    }),
    journalEntries: many(journalEntries),
  })
);

export const partnerAnswersRelations = relations(partnerAnswers, ({ one }) => ({
  session: one(weeklySessions, {
    fields: [partnerAnswers.sessionId],
    references: [weeklySessions.id],
  }),
  user: one(users, { fields: [partnerAnswers.userId], references: [users.id] }),
}));
