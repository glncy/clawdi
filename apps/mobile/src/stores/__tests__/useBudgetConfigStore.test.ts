import { load, save } from "@/utils/storage/storage";
import { useBudgetConfigStore } from "../useBudgetConfigStore";

jest.mock("@/utils/storage/storage", () => ({
  load: jest.fn(),
  save: jest.fn(),
}));

const mockedLoad = load as jest.MockedFunction<typeof load>;
const mockedSave = save as jest.MockedFunction<typeof save>;

function resetStore() {
  useBudgetConfigStore.setState({
    includedAccountIds: [],
    hydrated: false,
  });
}

describe("useBudgetConfigStore", () => {
  beforeEach(() => {
    resetStore();
    mockedLoad.mockReset();
    mockedSave.mockReset();
    mockedSave.mockResolvedValue(true);
  });

  it("starts empty (= include all accounts) and unhydrated", () => {
    const state = useBudgetConfigStore.getState();
    expect(state.includedAccountIds).toEqual([]);
    expect(state.hydrated).toBe(false);
  });

  it("hydrate with no stored value flips hydrated=true and keeps empty list", async () => {
    mockedLoad.mockResolvedValueOnce(null);

    await useBudgetConfigStore.getState().hydrate();

    const state = useBudgetConfigStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.includedAccountIds).toEqual([]);
    expect(mockedLoad).toHaveBeenCalledWith("budget:config:v1");
  });

  it("hydrate restores persisted included account ids", async () => {
    mockedLoad.mockResolvedValueOnce({ includedAccountIds: ["a", "b"] });

    await useBudgetConfigStore.getState().hydrate();

    const state = useBudgetConfigStore.getState();
    expect(state.hydrated).toBe(true);
    expect(state.includedAccountIds).toEqual(["a", "b"]);
  });

  it("setIncludedAccountIds updates state and persists via save()", async () => {
    await useBudgetConfigStore.getState().setIncludedAccountIds(["a", "b"]);

    expect(useBudgetConfigStore.getState().includedAccountIds).toEqual([
      "a",
      "b",
    ]);
    expect(mockedSave).toHaveBeenCalledWith("budget:config:v1", {
      includedAccountIds: ["a", "b"],
    });
  });

  it("round-trips: set → re-hydrate from the same stored payload yields same list", async () => {
    // Capture what gets written on set, then replay it through load on hydrate.
    let persisted: { includedAccountIds: string[] } | null = null;
    mockedSave.mockImplementation(async (_key: string, value: unknown) => {
      persisted = value as { includedAccountIds: string[] };
      return true;
    });
    mockedLoad.mockImplementation(async () => persisted);

    await useBudgetConfigStore
      .getState()
      .setIncludedAccountIds(["acct-1", "acct-2"]);

    // Simulate a fresh boot.
    resetStore();
    await useBudgetConfigStore.getState().hydrate();

    expect(useBudgetConfigStore.getState().includedAccountIds).toEqual([
      "acct-1",
      "acct-2",
    ]);
    expect(useBudgetConfigStore.getState().hydrated).toBe(true);
  });

  it("empty list after set persists as empty (= include all)", async () => {
    await useBudgetConfigStore.getState().setIncludedAccountIds([]);

    expect(useBudgetConfigStore.getState().includedAccountIds).toEqual([]);
    expect(mockedSave).toHaveBeenCalledWith("budget:config:v1", {
      includedAccountIds: [],
    });
  });
});
