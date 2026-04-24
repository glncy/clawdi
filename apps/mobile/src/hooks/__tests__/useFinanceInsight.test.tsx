import React from "react";
import { render, act, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";

// --- Mocks (must be declared before importing the hook) ---
jest.mock("@/utils/storage/storage", () => ({
  load: jest.fn(),
  save: jest.fn(),
}));

jest.mock("@/services/financeInsightPrompt", () => ({
  buildFinanceInsightPrompt: jest.fn(() => "stub-prompt"),
  FINANCE_INSIGHT_SYSTEM_PROMPT: "stub-system",
}));

const mockComplete = jest.fn();
jest.mock("@/hooks/useLocalAI", () => ({
  useLocalAI: () => ({ complete: mockComplete }),
}));

jest.mock("@/hooks/useIsAIAvailable", () => ({
  useIsAIAvailable: () => true,
}));

let mockStubData = {
  totalBalance: 1000,
  dailyBudget: 50,
  budgetLeftToday: 30,
  monthIncome: 2000,
  monthSpent: 500,
  todaySpent: 20,
  thisWeekSpending: [{ date: "2026-04-24", amount: 100 }],
  categoryBudgets: [
    { category: "Food", icon: "🍕", budgetAmount: 200, spentAmount: 150 },
  ],
  recurringBills: [
    {
      id: "bill-1",
      amount: 100,
      frequency: "monthly" as const,
      nextDueDate: "2026-05-01",
      isPaid: false,
      isArchived: false,
    },
  ],
  savingsGoals: [
    { id: "goal-1", currentAmount: 300, targetAmount: 1000 },
  ],
};

const mockInitialStubData = { ...mockStubData };

jest.mock("@/hooks/useFinanceData", () => ({
  useFinanceData: () => mockStubData,
}));

jest.mock("@/hooks/useCurrency", () => ({
  useCurrency: () => ({ symbol: "$" }),
}));

// Import after mocks are declared
import { useFinanceInsight } from "../useFinanceInsight";
import { load as kvLoad, save as kvSave } from "@/utils/storage/storage";

const mockedLoad = kvLoad as jest.MockedFunction<typeof kvLoad>;
const mockedSave = kvSave as jest.MockedFunction<typeof kvSave>;

function HookHost({
  onState,
}: {
  onState: (state: { insight: string | null; isGenerating: boolean }) => void;
}) {
  const { insight, isGenerating } = useFinanceInsight();
  React.useEffect(() => {
    onState({ insight, isGenerating });
  }, [insight, isGenerating, onState]);
  return <Text>{insight ?? ""}</Text>;
}

describe("useFinanceInsight", () => {
  beforeEach(() => {
    // resetAllMocks clears both call history AND queued .mockResolvedValueOnce
    // implementations so tests are fully isolated.
    jest.resetAllMocks();
    mockStubData = { ...mockInitialStubData };
  });

  it("cache hit: returns cached insight without calling complete", async () => {
    mockedLoad.mockResolvedValueOnce({ insight: "cached" });

    const states: Array<{ insight: string | null; isGenerating: boolean }> = [];
    render(<HookHost onState={(s) => states.push(s)} />);

    await waitFor(() => {
      expect(states.some((s) => s.insight === "cached")).toBe(true);
    });

    expect(mockComplete).not.toHaveBeenCalled();
    expect(mockedSave).not.toHaveBeenCalled();
  });

  it("cache miss: generates insight, persists it via save", async () => {
    mockedLoad.mockResolvedValueOnce(null);
    mockComplete.mockResolvedValueOnce({ text: "new" });

    const states: Array<{ insight: string | null; isGenerating: boolean }> = [];
    render(<HookHost onState={(s) => states.push(s)} />);

    await waitFor(() => {
      expect(states.some((s) => s.insight === "new")).toBe(true);
    });

    expect(mockComplete).toHaveBeenCalledTimes(1);
    expect(mockedSave).toHaveBeenCalledTimes(1);

    const loadKey = mockedLoad.mock.calls[0]?.[0];
    const saveKey = mockedSave.mock.calls[0]?.[0];
    expect(saveKey).toBe(loadKey);

    const savedValue = mockedSave.mock.calls[0]?.[1];
    expect(savedValue).toEqual({ insight: "new" });
  });

  it("same-bucket re-render does not regenerate", async () => {
    // First mount: cache miss, generates.
    mockedLoad.mockResolvedValueOnce(null);
    mockComplete.mockResolvedValueOnce({ text: "new" });

    const { rerender } = render(<HookHost onState={() => {}} />);

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledTimes(1);
    });

    // Second mount (re-render same tree) with same snapshot should NOT call complete again.
    // The next kvLoad is a cache hit (because save was called) — simulate that.
    mockedLoad.mockResolvedValueOnce({ insight: "new" });

    await act(async () => {
      rerender(<HookHost onState={() => {}} />);
    });

    // complete should still have been called only once
    expect(mockComplete).toHaveBeenCalledTimes(1);
  });

  it("different snapshot key regenerates", async () => {
    // First mount: cache miss, generates insight "A".
    mockedLoad.mockResolvedValueOnce(null);
    mockComplete.mockResolvedValueOnce({ text: "A" });

    const { rerender } = render(<HookHost onState={() => {}} />);

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledTimes(1);
    });

    // Mutate the snapshot so the next cache key differs.
    mockStubData = { ...mockStubData, todaySpent: 9999 };

    // Second render: cache miss for the new key, generates insight "B".
    mockedLoad.mockResolvedValueOnce(null);
    mockComplete.mockResolvedValueOnce({ text: "B" });

    await act(async () => {
      rerender(<HookHost onState={() => {}} />);
    });

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledTimes(2);
    });

    // Two different cache keys should have been queried.
    const firstKey = mockedLoad.mock.calls[0]?.[0];
    const secondKey = mockedLoad.mock.calls[1]?.[0];
    expect(firstKey).not.toBe(secondKey);
  });
});
