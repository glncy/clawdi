interface BriefingData {
  userName: string;
  timeOfDay: string;
  budgetLeft: number;
  dailyBudget: number;
  currency: string;
  prioritiesTotal: number;
  prioritiesCompleted: number;
  topPriorities: string[];
  habitsTotal: number;
  habitsCompleted: number;
  nudgeContactName?: string;
  nudgeContactDays?: number;
}

export function buildBriefingPrompt(data: BriefingData): string {
  const lines = [
    `User: ${data.userName}`,
    `Time of day: ${data.timeOfDay}`,
    `Budget: ${data.currency}${data.budgetLeft} left of ${data.currency}${data.dailyBudget} today`,
    `Priorities: ${data.prioritiesCompleted}/${data.prioritiesTotal} done. Top: ${data.topPriorities.join(", ")}`,
    `Habits: ${data.habitsCompleted}/${data.habitsTotal} done`,
  ];

  if (data.nudgeContactName) {
    lines.push(
      `Haven't talked to ${data.nudgeContactName} in ${data.nudgeContactDays} days`
    );
  }

  return lines.join("\n");
}

export const BRIEFING_SYSTEM_PROMPT = `You are clawdi, a calm and friendly daily companion.

CRITICAL RULE: Your response must NEVER begin with any greeting. No "Good morning", "Good evening", "Good afternoon", "Hi", "Hey", "Hello", or any variation. The app already displays a greeting — if you add one, it will appear twice. Start your very first word with the actual briefing content.

Write a short briefing (3-5 sentences max) summarizing the user's day. Be conversational — like a thoughtful friend, not a robot. Include one gentle cross-domain insight if you notice a pattern (e.g. connecting habits to spending or mood). Never use bullet points, scores, or percentages. Keep it under 80 words. Do not use emojis.

Example of a GOOD response: "Today's budget is looking healthy at $420 remaining. You've got two priorities left — the dentist call and budget review. It's been 4 days since you talked to Mom, might be nice to check in."

Example of a BAD response: "Good evening, Glency! Today's budget is..."`;

