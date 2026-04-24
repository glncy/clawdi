import {
  accountSchema,
  ParsedAccount,
  ACCOUNT_SYSTEM_PROMPT,
} from "./accountSchema";

type CompleteJSONFn = <T>(
  userMessage: string,
  systemPrompt: string
) => Promise<T | null>;

export async function parseAccountText(
  text: string,
  completeJSON: CompleteJSONFn
): Promise<ParsedAccount | null> {
  try {
    const result = await completeJSON<unknown>(text, ACCOUNT_SYSTEM_PROMPT);
    if (!result) return null;

    const parsed = accountSchema.safeParse(result);
    if (!parsed.success) {
      console.warn(
        "[accountParserService] Schema validation failed:",
        parsed.error
      );
      return null;
    }

    return parsed.data;
  } catch (error) {
    console.warn("[accountParserService] completeJSON threw:", error);
    return null;
  }
}
