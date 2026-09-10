import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Le prénom est requis").max(60),
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z
    .string()
    .min(10, "10 caractères minimum")
    .max(200)
    .regex(/[A-Za-z]/, "Doit contenir au moins une lettre")
    .regex(/[0-9]/, "Doit contenir au moins un chiffre"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

export const createCoupleSchema = z.object({
  name: z.string().trim().max(60).optional(),
});

export const joinCoupleSchema = z.object({
  code: z.string().trim().min(6).max(20),
});

export const boundarySchema = z.object({
  category: z.enum(["love", "curious", "avoid", "hard_limit"]),
  label: z.string().trim().min(1).max(120),
});

export const partnerAnswerSchema = z.object({
  sessionId: z.string().uuid(),
  moods: z.array(z.string()).max(10),
  energyLevel: z.number().int().min(1).max(5),
  noveltySeek: z.number().int().min(1).max(5),
  intensity: z.enum(["soft", "sensual", "intense", "very_intense"]),
  preferences: z.array(z.string()).max(20),
  optOut: z.boolean().default(false),
  notes: z.string().max(500).optional(),
});
