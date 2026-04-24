import type { Priority } from "../types";

export type DayVoiceAction =
  | { action: "add_priority"; type: Priority["type"]; text: string }
  | { action: "add_quick_list"; text: string }
  | { action: "tonight_planner"; text: string }
  | { action: "complete_priority"; type: Priority["type"]; index: number };

const KNOWN_ACTIONS = [
  "add_priority",
  "add_quick_list",
  "tonight_planner",
  "complete_priority",
];

export const DAY_VOICE_SYSTEM_PROMPT = `You are clawdi's Day assistant. Parse the user's voice utterance into a structured action JSON object.

Return ONLY valid JSON, no explanation. Use one of these actions:

1. Add a priority:
{"action":"add_priority","type":"must","text":"<text>"}
type is one of: "must", "win", "overdue"

2. Add to quick list:
{"action":"add_quick_list","text":"<text>"}

3. Set tonight plan:
{"action":"tonight_planner","text":"<text>"}

4. Complete a priority:
{"action":"complete_priority","type":"must","index":0}
index is 0 for first of that type.

Map utterances:
- "Add priority: X" → add_priority, type must
- "Add win: X" → add_priority, type win
- "Add overdue: X" → add_priority, type overdue
- "Done with my must" → complete_priority, type must, index 0
- "Add to list: X" or "Add X to my list" → add_quick_list
- "Tonight I'll X" or "Plan tonight: X" → tonight_planner

Return null JSON value if the utterance cannot be parsed.`;

export function buildDayVoicePrompt(utterance: string): string {
  return `Parse this voice utterance into a Day action:\n\n"${utterance}"`;
}

export function parseDayVoiceResult(raw: string): DayVoiceAction | null {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!KNOWN_ACTIONS.includes(parsed.action)) return null;

    switch (parsed.action) {
      case "add_priority":
        if (!parsed.text || !["must", "win", "overdue"].includes(parsed.type)) {
          return null;
        }
        return { action: "add_priority", type: parsed.type, text: parsed.text };

      case "add_quick_list":
        if (!parsed.text) return null;
        return { action: "add_quick_list", text: parsed.text };

      case "tonight_planner":
        if (!parsed.text) return null;
        return { action: "tonight_planner", text: parsed.text };

      case "complete_priority":
        if (!["must", "win", "overdue"].includes(parsed.type)) return null;
        return {
          action: "complete_priority",
          type: parsed.type,
          index: typeof parsed.index === "number" ? parsed.index : 0,
        };

      default:
        return null;
    }
  } catch {
    return null;
  }
}
