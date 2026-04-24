import { z } from "zod";

export const billSchema = z.object({
  name: z.string().min(1),
  amount: z.number().positive(),
  frequency: z.enum(["once", "weekly", "monthly", "yearly"]),
  category: z.string().optional(),
});

export type ParsedBill = z.infer<typeof billSchema>;

export const BILL_SYSTEM_PROMPT = `You extract recurring-bill / reminder details from short user input.
Return ONLY JSON matching: { "name": string, "amount": number, "frequency": "once"|"weekly"|"monthly"|"yearly", "category": string? }.
If the user says "one-time" / "just this once" / "tomorrow" / a single specific date → frequency="once".
Default to "monthly" if unclear. No prose.`;
