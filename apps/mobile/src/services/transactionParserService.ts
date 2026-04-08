import {
  transactionSchema,
  ParsedTransaction,
  TRANSACTION_SYSTEM_PROMPT,
} from "./transactionSchema";

type CompleteJSONFn = <T>(
  userMessage: string,
  systemPrompt: string
) => Promise<T | null>;

export async function parseTransactionText(
  text: string,
  completeJSON: CompleteJSONFn
): Promise<ParsedTransaction | null> {
  const result = await completeJSON<unknown>(text, TRANSACTION_SYSTEM_PROMPT);
  if (!result) return null;

  const parsed = transactionSchema.safeParse(result);
  if (!parsed.success) {
    console.warn("[transactionParserService] Schema validation failed:", parsed.error);
    return null;
  }

  return parsed.data;
}
