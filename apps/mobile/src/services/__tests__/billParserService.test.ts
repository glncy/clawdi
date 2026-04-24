import { parseBillText } from "../billParserService";
import { BILL_SYSTEM_PROMPT } from "../billSchema";

describe("billParserService", () => {
  it("returns parsed bill when completeJSON yields a well-formed object", async () => {
    const completeJSON = jest.fn().mockResolvedValue({
      name: "Netflix",
      amount: 15.99,
      frequency: "monthly",
      category: "Entertainment",
    });

    const result = await parseBillText("netflix 15.99 monthly", completeJSON);

    expect(result).toEqual({
      name: "Netflix",
      amount: 15.99,
      frequency: "monthly",
      category: "Entertainment",
    });
    expect(completeJSON).toHaveBeenCalledWith(
      "netflix 15.99 monthly",
      BILL_SYSTEM_PROMPT
    );
  });

  it("accepts a bill without optional category", async () => {
    const completeJSON = jest.fn().mockResolvedValue({
      name: "Rent",
      amount: 1200,
      frequency: "monthly",
    });

    const result = await parseBillText("rent 1200", completeJSON);

    expect(result).toEqual({ name: "Rent", amount: 1200, frequency: "monthly" });
  });

  it("returns null when completeJSON yields a malformed object (missing amount)", async () => {
    const completeJSON = jest
      .fn()
      .mockResolvedValue({ name: "Gym", frequency: "monthly" });

    const result = await parseBillText("gym monthly", completeJSON);

    expect(result).toBeNull();
  });

  it("returns null when completeJSON yields an invalid frequency", async () => {
    const completeJSON = jest.fn().mockResolvedValue({
      name: "Phone",
      amount: 50,
      frequency: "biweekly",
    });

    const result = await parseBillText("phone 50 biweekly", completeJSON);

    expect(result).toBeNull();
  });

  it("returns null when amount is not positive", async () => {
    const completeJSON = jest.fn().mockResolvedValue({
      name: "Weird",
      amount: 0,
      frequency: "once",
    });

    const result = await parseBillText("weird", completeJSON);

    expect(result).toBeNull();
  });

  it("returns null when completeJSON returns null", async () => {
    const completeJSON = jest.fn().mockResolvedValue(null);

    const result = await parseBillText("unparseable", completeJSON);

    expect(result).toBeNull();
  });

  it("returns null when completeJSON throws", async () => {
    const completeJSON = jest.fn().mockRejectedValue(new Error("boom"));

    const result = await parseBillText("anything", completeJSON);

    expect(result).toBeNull();
  });
});
