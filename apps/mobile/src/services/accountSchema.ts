import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  balance: z.number(),
});

export type ParsedAccount = z.infer<typeof accountSchema>;

export const ACCOUNT_SYSTEM_PROMPT = `You extract bank account details from short user input.
Return ONLY JSON matching: { "name": string, "type": string, "balance": number }.
"type" should be one of: checking, savings, credit, cash, investment — or a custom single word.
If balance isn't given, return 0. No extra keys, no prose.`;
