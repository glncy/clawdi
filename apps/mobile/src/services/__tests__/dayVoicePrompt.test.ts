import {
  buildDayVoicePrompt,
  parseDayVoiceResult,
  DAY_VOICE_SYSTEM_PROMPT,
} from "../dayVoicePrompt";

describe("dayVoicePrompt", () => {
  it("exports a system prompt string", () => {
    expect(typeof DAY_VOICE_SYSTEM_PROMPT).toBe("string");
    expect(DAY_VOICE_SYSTEM_PROMPT.length).toBeGreaterThan(10);
  });

  it("buildDayVoicePrompt returns a string with the utterance", () => {
    const result = buildDayVoicePrompt("Add priority: submit the proposal");
    expect(typeof result).toBe("string");
    expect(result).toContain("submit the proposal");
  });

  it("parseDayVoiceResult parses add_priority must action", () => {
    const json = JSON.stringify({
      action: "add_priority",
      type: "must",
      text: "Submit the proposal",
    });
    const result = parseDayVoiceResult(json);
    expect(result).toEqual({
      action: "add_priority",
      type: "must",
      text: "Submit the proposal",
    });
  });

  it("parseDayVoiceResult parses add_priority win action", () => {
    const json = JSON.stringify({
      action: "add_priority",
      type: "win",
      text: "Clean the kitchen",
    });
    const result = parseDayVoiceResult(json);
    expect(result?.action).toBe("add_priority");
    expect(result?.type).toBe("win");
  });

  it("parseDayVoiceResult parses add_quick_list action", () => {
    const json = JSON.stringify({
      action: "add_quick_list",
      text: "Buy milk",
    });
    const result = parseDayVoiceResult(json);
    expect(result?.action).toBe("add_quick_list");
    expect(result?.text).toBe("Buy milk");
  });

  it("parseDayVoiceResult parses tonight_planner action", () => {
    const json = JSON.stringify({
      action: "tonight_planner",
      text: "Read → Sleep by 11 PM",
    });
    const result = parseDayVoiceResult(json);
    expect(result?.action).toBe("tonight_planner");
    expect(result?.text).toBe("Read → Sleep by 11 PM");
  });

  it("parseDayVoiceResult parses complete_priority action", () => {
    const json = JSON.stringify({
      action: "complete_priority",
      type: "must",
      index: 0,
    });
    const result = parseDayVoiceResult(json);
    expect(result?.action).toBe("complete_priority");
    expect(result?.type).toBe("must");
  });

  it("parseDayVoiceResult returns null for invalid JSON", () => {
    expect(parseDayVoiceResult("not json")).toBeNull();
  });

  it("parseDayVoiceResult returns null for unknown action", () => {
    const json = JSON.stringify({ action: "unknown_action" });
    expect(parseDayVoiceResult(json)).toBeNull();
  });
});
