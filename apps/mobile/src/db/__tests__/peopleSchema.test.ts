import {
  contacts,
  interactions,
  nextTopics,
  specialDates,
  gifts,
} from "../schema";

describe("people schema", () => {
  it("contacts table has required columns", () => {
    const cols = Object.keys(contacts);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "name",
        "phone",
        "notes",
        "nudgeFrequencyDays",
        "source",
        "deviceContactId",
        "createdAt",
        "updatedAt",
      ]),
    );
  });

  it("interactions table has required columns", () => {
    const cols = Object.keys(interactions);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "contactId",
        "type",
        "note",
        "aiSummary",
        "occurredAt",
        "createdAt",
      ]),
    );
  });

  it("nextTopics table has required columns", () => {
    const cols = Object.keys(nextTopics);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "contactId",
        "topic",
        "isDone",
        "createdAt",
      ]),
    );
  });

  it("specialDates table has required columns", () => {
    const cols = Object.keys(specialDates);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "contactId",
        "type",
        "label",
        "month",
        "day",
        "createdAt",
      ]),
    );
  });

  it("gifts table has required columns", () => {
    const cols = Object.keys(gifts);
    expect(cols).toEqual(
      expect.arrayContaining([
        "id",
        "contactId",
        "specialDateId",
        "name",
        "isAiSuggested",
        "givenAt",
        "createdAt",
      ]),
    );
  });
});
