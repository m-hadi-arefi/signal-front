import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email"),
  username: z
    .string()
    .min(3, "Min 3 chars")
    .max(32, "Max 32 chars"),
  password: z
    .string()
    .min(8, "Min 8 chars")
    .regex(/[A-Z]/, "Need uppercase")
    .regex(/[0-9]/, "Need number"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signalSchema = z.object({
  symbol: z.string().min(1).max(20).toUpperCase(),
  rawText: z.string().min(10).max(5000).optional(),
  aiSummary: z.string().max(1000).optional(),
  latestPrice: z.number().positive().optional(),
  source: z.string().max(200).optional(),
  scenarios: z
    .array(
      z.object({
        direction: z.enum(["LONG", "SHORT", "NEUTRAL"]),
        entryPoint: z.number().positive().optional(),
        entryType: z.enum(["MARKET", "LIMIT", "STOP", "FIX"]).default("LIMIT"),
        takeProfits: z.array(z.number().positive()).min(1).max(10),
        stopLoss: z.number().positive().optional(),
        invalidation: z.string().max(500).optional(),
        confidence: z.number().int().min(0).max(100).optional(),
        reasoning: z.string().min(10).max(2000),
        raw: z.string().max(5000).optional(),
      })
    )
    .min(1)
    .max(5),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(2000),
  parentId: z.string().optional(),
});

export const profileUpdateSchema = z.object({
  bio: z.string().max(500).optional(),
  avatar: z
    .string()
    .url()
    .refine((url) => /^https?:\/\//i.test(url), "Avatar must be an http/https URL")
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z
    .string()
    .min(8, "Min 8 chars")
    .regex(/[A-Z]/, "Need uppercase")
    .regex(/[0-9]/, "Need number"),
});

export const signalUpdateSchema = z.object({
  rawText: z.string().min(10).max(5000).optional(),
  aiSummary: z.string().max(1000).optional(),
});
