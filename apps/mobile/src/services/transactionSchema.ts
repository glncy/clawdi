import { z } from "zod";

export const transactionSchema = z.object({
  type: z
    .enum(["income", "expense"])
    .describe("Whether this is income received or an expense paid"),
  item: z.string().describe("What was purchased or the income source"),
  amount: z.number().describe("The numeric amount"),
  currency: z.string().describe("Currency code, default USD").default("USD"),
  category: z
    .string()
    .min(1)
    .describe("Spending or income category"),
});

export type ParsedTransaction = z.infer<typeof transactionSchema>;

export const TRANSACTION_SYSTEM_PROMPT = `You are a financial transaction parser. The user will describe a transaction in natural language — it can be an expense OR income. Extract the type, item, amount, currency, and category. Respond with JSON only.

Examples:
User: "coffee 4.50"
{"type":"expense","item":"coffee","amount":4.50,"currency":"USD","category":"Food"}

User: "received salary 3000"
{"type":"income","item":"salary","amount":3000,"currency":"USD","category":"Other"}

User: "2 pieces of bread 200 pesos"
{"type":"expense","item":"bread","amount":200,"currency":"PHP","category":"Groceries"}

User: "freelance payment 500"
{"type":"income","item":"freelance payment","amount":500,"currency":"USD","category":"Other"}`;
