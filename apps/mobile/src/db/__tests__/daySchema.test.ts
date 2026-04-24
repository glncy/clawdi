import { priorities, quickList, metadata } from "../schema";

function expectExactColumns(
  table: Record<string, unknown>,
  expected: string[],
): void {
  expect(Object.keys(table).sort()).toEqual([...expected].sort());
}

describe("day schema", () => {
  it("priorities table has exactly the required columns", () => {
    expectExactColumns(priorities, [
      "id",
      "text",
      "type",
      "date",
      "completed",
      "completedAt",
      "sortOrder",
      "rolledOverFrom",
      "createdAt",
    ]);
  });

  it("quickList table has exactly the required columns", () => {
    expectExactColumns(quickList, [
      "id",
      "text",
      "completed",
      "completedAt",
      "sortOrder",
      "createdAt",
    ]);
  });

  it("metadata table has exactly the required columns", () => {
    expectExactColumns(metadata, ["key", "value", "updatedAt"]);
  });
});
