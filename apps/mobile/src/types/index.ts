export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: string;
  item: string;
  category: string;
  date: string;
  note?: string;
  accountId?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: string;
  icon?: string;
}

export interface Habit {
  id: string;
  name: string;
  icon: string;
  isCompleted: boolean;
}

export interface Mood {
  id: string;
  type: "morning" | "night";
  rating: number; // 1-5
  date: string;
}

export interface Priority {
  id: string;
  text: string;
  type: "must" | "win" | "overdue";
  isCompleted: boolean;
}

export interface Contact {
  id: string;
  name: string;
  relationship: string;
  birthday?: string;
  lastTalkedDaysAgo: number;
  giftIdea?: string;
  thingsTheyLove?: string;
}

export interface SleepLog {
  id: string;
  hours: number;
  minutes: number;
  date: string;
}

export interface Spark {
  id: string;
  text: string;
  domain: string;
  isCompleted: boolean;
}

export interface QuickListItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface DomainScore {
  label: string;
  icon: string;
  progress: number;
}

export interface CategoryBudget {
  category: string;
  icon: string;
  budgetAmount: number;
  spentAmount: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "cash" | "investment";
  balance: number;
  currency: string;
  icon: string;
  excludeFromBudget?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  isDefault: boolean;
  sortOrder: number;
}

export interface BudgetSetting {
  id: string;
  category: string;
  budgetAmount: number;
  period: string;
}

export interface RecurringBill {
  id: string;
  name: string;
  amount: number;
  currency: string;
  frequency: "weekly" | "monthly" | "yearly";
  nextDueDate: string;
  category: string;
  isPaid: boolean;
}
