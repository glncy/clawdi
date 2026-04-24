export interface DayInsightData {
  priorityCount: number;
  mustCount: number;
  winCount: number;
  overdueCount: number;
  completedToday: number;
  pomodoroSessionsToday: number;
  timeOfDay: "morning" | "afternoon" | "evening";
}

export function buildDayInsightPrompt(data: DayInsightData): string {
  const completionPct =
    data.priorityCount > 0
      ? Math.round((data.completedToday / data.priorityCount) * 100)
      : 0;

  const lines = [
    `Time: ${data.timeOfDay}`,
    `Priorities: ${data.priorityCount} total (${data.mustCount} must, ${data.winCount} win, ${data.overdueCount} overdue)`,
    `Completed today: ${data.completedToday} of ${data.priorityCount} (${completionPct}%)`,
    `Focus sessions (Pomodoro): ${data.pomodoroSessionsToday}`,
  ];

  return lines.join("\n");
}

export function getTimeOfDay(): DayInsightData["timeOfDay"] {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export const DAY_INSIGHT_SYSTEM_PROMPT = `You are clawdi's Day planner assistant. Generate a brief, personalized planning insight (2-3 sentences max) based on the user's current priorities and focus sessions.

Be specific and actionable. If there are too many priorities, suggest focusing on fewer. If they've completed sessions, acknowledge the momentum. If it's evening with few completions, be encouraging rather than critical.

Do not use bullet points, emojis, or headers. Write like a supportive coach who notices what matters. Keep it under 50 words.`;
