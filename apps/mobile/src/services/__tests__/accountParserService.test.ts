import { parseAccountText } from "../accountParserService";
import { ACCOUNT_SYSTEM_PROMPT } from "../accountSchema";

describe("accountParserService", () => {
  it("returns parsed account when completeJSON yields a well-formed object", async () => {
    const completeJSON = jest
      .fn()
      .mockResolvedValue({ name: "Main Checking", type: "checking", balance: 1250.5 });

    const result = await parseAccountText("main checking 1250.50", completeJSON);

    expect(result).toEqual({ name: "Main Checking", type: "checking", balance: 1250.5 });
    expect(completeJSON).toHaveBeenCalledWith(
      "main checking 1250.50",
      ACCOUNT_SYSTEM_PROMPT
    );
  });

  it("returns null when completeJSON yields a malformed object (missing field)", async () => {
    const completeJSON = jest
      .fn()
      .mockResolvedValue({ name: "Savings", balance: 500 });

    const result = await parseAccountText("savings 500", completeJSON);

    expect(result).toBeNull();
  });

  it("returns null when completeJSON yields a malformed object (wrong type)", async () => {
    const completeJSON = jest
      .fn()
      .mockResolvedValue({ name: "Cash", type: "cash", balance: "not a number" });

    const result = await parseAccountText("cash account", completeJSON);

    expect(result).toBeNull();
  });

  it("returns null when completeJSON returns null", async () => {
    const completeJSON = jest.fn().mockResolvedValue(null);

    const result = await parseAccountText("unparseable", completeJSON);

    expect(result).toBeNull();
  });

  it("returns null when completeJSON throws", async () => {
    const completeJSON = jest.fn().mockRejectedValue(new Error("network down"));

    const result = await parseAccountText("anything", completeJSON);

    expect(result).toBeNull();
  });
});
