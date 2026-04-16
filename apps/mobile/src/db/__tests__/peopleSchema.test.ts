import {
  contacts,
  interactions,
  nextTopics,
  specialDates,
  gifts,
} from "../schema";

function expectExactColumns(
  table: Record<string, unknown>,
  expected: string[],
): void {
  expect(Object.keys(table).sort()).toEqual([...expected].sort());
}

describe("people schema", () => {
  it("contacts table has exactly the required columns", () => {
    expectExactColumns(contacts, [
      "id",
      "name",
      "phone",
      "notes",
      "nudgeFrequencyDays",
      "source",
      "deviceContactId",
      "createdAt",
      "updatedAt",
    ]);
  });

  it("interactions table has exactly the required columns", () => {
    expectExactColumns(interactions, [
      "id",
      "contactId",
      "type",
      "note",
      "aiSummary",
      "occurredAt",
      "createdAt",
    ]);
  });

  it("nextTopics table has exactly the required columns", () => {
    expectExactColumns(nextTopics, [
      "id",
      "contactId",
      "topic",
      "isDone",
      "createdAt",
    ]);
  });

  it("specialDates table has exactly the required columns", () => {
    expectExactColumns(specialDates, [
      "id",
      "contactId",
      "type",
      "label",
      "month",
      "day",
      "createdAt",
    ]);
  });

  it("gifts table has exactly the required columns", () => {
    expectExactColumns(gifts, [
      "id",
      "contactId",
      "specialDateId",
      "name",
      "isAiSuggested",
      "givenAt",
      "createdAt",
    ]);
  });
});
