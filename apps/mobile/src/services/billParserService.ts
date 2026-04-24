import { billSchema, ParsedBill, BILL_SYSTEM_PROMPT } from "./billSchema";

type CompleteJSONFn = <T>(
  userMessage: string,
  systemPrompt: string
) => Promise<T | null>;

export async function parseBillText(
  text: string,
  completeJSON: CompleteJSONFn
): Promise<ParsedBill | null> {
  try {
    const result = await completeJSON<unknown>(text, BILL_SYSTEM_PROMPT);
    if (!result) return null;

    const parsed = billSchema.safeParse(result);
    if (!parsed.success) {
      console.warn(
        "[billParserService] Schema validation failed:",
        parsed.error
      );
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.warn("[billParserService] completeJSON threw:", error);
    return null;
  }
}
