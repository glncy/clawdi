import {
  buildDayInsightPrompt,
  DAY_INSIGHT_SYSTEM_PROMPT,
} from "../dayInsightPrompt";

describe("dayInsightPrompt", () => {
  it("exports a system prompt string", () => {
    expect(typeof DAY_INSIGHT_SYSTEM_PROMPT).toBe("string");
    expect(DAY_INSIGHT_SYSTEM_PROMPT.length).toBeGreaterThan(10);
  });

  it("buildDayInsightPrompt includes key data points in the output", () => {
    const result = buildDayInsightPrompt({
      priorityCount: 5,
      mustCount: 3,
      winCount: 1,
      overdueCount: 1,
      completedToday: 2,
      pomodoroSessionsToday: 1,
      timeOfDay: "morning",
    });

    expect(typeof result).toBe("string");
    expect(result).toContain("5");
    expect(result).toContain("2");
    expect(result).toContain("morning");
  });

  it("buildDayInsightPrompt handles zero priorities", () => {
    const result = buildDayInsightPrompt({
      priorityCount: 0,
      mustCount: 0,
      winCount: 0,
      overdueCount: 0,
      completedToday: 0,
      pomodoroSessionsToday: 0,
      timeOfDay: "afternoon",
    });

    expect(typeof result).toBe("string");
    expect(result).toContain("afternoon");
  });

  it("buildDayInsightPrompt includes pomodoro sessions", () => {
    const result = buildDayInsightPrompt({
      priorityCount: 3,
      mustCount: 2,
      winCount: 1,
      overdueCount: 0,
      completedToday: 1,
      pomodoroSessionsToday: 3,
      timeOfDay: "evening",
    });

    expect(result).toContain("3");
  });
});
