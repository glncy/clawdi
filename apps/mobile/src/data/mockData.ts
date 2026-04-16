import type {
  Transaction,
  SavingsGoal,
  Habit,
  Priority,
  SleepLog,
  Spark,
  QuickListItem,
  DomainScore,
  CategoryBudget,
  DailySpending,
  Account,
  RecurringBill,
} from "@/types";

export const MOCK_DOMAIN_SCORES: DomainScore[] = [
  { label: "Money", icon: "💰", progress: 0.7 },
  { label: "Time", icon: "⏰", progress: 0.65 },
  { label: "Health", icon: "🏥", progress: 0.8 },
  { label: "Mind", icon: "🧠", progress: 0.6 },
  { label: "People", icon: "❤️", progress: 0.85 },
  { label: "Growth", icon: "🎯", progress: 0.75 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "1", type: "expense", amount: 4.5, currency: "USD", item: "Morning coffee", category: "Food", date: "2026-04-01" },
  { id: "2", type: "expense", amount: 32.0, currency: "USD", item: "Groceries", category: "Groceries", date: "2026-04-01" },
  { id: "3", type: "expense", amount: 2.5, currency: "USD", item: "Bus fare", category: "Transport", date: "2026-03-31" },
  { id: "4", type: "expense", amount: 18.5, currency: "USD", item: "Lunch with team", category: "Food", date: "2026-03-31" },
];

export const MOCK_SAVINGS_GOALS: SavingsGoal[] = [
  { id: "1", name: "Travel Fund", targetAmount: 3000, currentAmount: 1200, currency: "USD", targetDate: "Oct 2026", icon: "✈️" },
  { id: "2", name: "Emergency Fund", targetAmount: 10000, currentAmount: 6500, currency: "USD", targetDate: "Dec 2026", icon: "🚨" },
  { id: "3", name: "New Laptop", targetAmount: 1500, currentAmount: 400, currency: "USD", targetDate: "Aug 2026", icon: "💻" },
];

export const MOCK_HABITS: Habit[] = [
  { id: "1", name: "Drink water", icon: "💧", isCompleted: true },
  { id: "2", name: "Read 15 min", icon: "📖", isCompleted: true },
  { id: "3", name: "Exercise", icon: "🏃", isCompleted: false },
  { id: "4", name: "Meditate", icon: "🧘", isCompleted: false },
  { id: "5", name: "No phone before bed", icon: "📵", isCompleted: false },
];

export const MOCK_PRIORITIES: Priority[] = [
  { id: "1", text: "Finish project proposal", type: "must", isCompleted: true },
  { id: "2", text: "Call dentist for appointment", type: "win", isCompleted: false },
  { id: "3", text: "Review budget for next month", type: "overdue", isCompleted: false },
];

export const MOCK_SLEEP: SleepLog = {
  id: "1",
  hours: 7,
  minutes: 20,
  date: "2026-04-01",
};

export const MOCK_SPARK: Spark = {
  id: "1",
  text: "Take a 10-minute walk",
  domain: "Health",
  isCompleted: false,
};

export const MOCK_QUICK_LIST: QuickListItem[] = [
  { id: "1", text: "Buy groceries: eggs, bread, milk", isCompleted: false },
  { id: "2", text: "Return library books", isCompleted: false },
  { id: "3", text: "Look into gym membership", isCompleted: false },
];

export const MOCK_CLAWDI_SCORE = 74;
export const MOCK_BUDGET_LEFT = 420;
export const MOCK_DAILY_BUDGET = 500;
export const MOCK_BALANCE = 2450;
export const MOCK_INCOME = 3200;
export const MOCK_SPENT = 750;
export const MOCK_STRESS_LEVEL = 4;
export const MOCK_WEEKLY_SLEEP_AVG = 6.5;

export const MOCK_CATEGORY_BUDGETS: CategoryBudget[] = [
  { category: "Food", icon: "🍽", budgetAmount: 200, spentAmount: 55 },
  { category: "Transport", icon: "🚌", budgetAmount: 100, spentAmount: 2.5 },
  { category: "Groceries", icon: "🛒", budgetAmount: 300, spentAmount: 32 },
  { category: "Shopping", icon: "🛍", budgetAmount: 150, spentAmount: 0 },
  { category: "Bills", icon: "📄", budgetAmount: 400, spentAmount: 120 },
];

export const MOCK_ACCOUNTS: Account[] = [
  { id: "1", name: "Main Checking", type: "checking", balance: 1850, currency: "USD", icon: "🏦" },
  { id: "2", name: "Savings", type: "savings", balance: 4200, currency: "USD", icon: "🐷" },
  { id: "3", name: "Credit Card", type: "credit", balance: -320, currency: "USD", icon: "💳" },
  { id: "4", name: "Cash", type: "cash", balance: 120, currency: "USD", icon: "💵" },
];

export const MOCK_RECURRING_BILLS: RecurringBill[] = [
  { id: "1", name: "Netflix", amount: 15.99, currency: "USD", frequency: "monthly", nextDueDate: "2026-04-15", category: "Entertainment", isPaid: false },
  { id: "2", name: "Rent", amount: 1200, currency: "USD", frequency: "monthly", nextDueDate: "2026-05-01", category: "Bills", isPaid: true },
  { id: "3", name: "Gym", amount: 29.99, currency: "USD", frequency: "monthly", nextDueDate: "2026-04-20", category: "Health", isPaid: false },
  { id: "4", name: "Phone Plan", amount: 45, currency: "USD", frequency: "monthly", nextDueDate: "2026-04-18", category: "Bills", isPaid: false },
];

export const MOCK_DAILY_SPENDING: DailySpending[] = [
  { date: "2026-03-31", amount: 21 },
  { date: "2026-04-01", amount: 36.5 },
  { date: "2026-04-02", amount: 15 },
  { date: "2026-04-03", amount: 55 },
  { date: "2026-04-04", amount: 42 },
  { date: "2026-04-05", amount: 28 },
  { date: "2026-04-06", amount: 12 },
];
