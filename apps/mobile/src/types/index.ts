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
  date: string;
  completedAt: string | null;
  sortOrder: number;
  rolledOverFrom: string | null;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  nudgeFrequencyDays: number;
  source: "manual" | "device";
  deviceContactId?: string;
  createdAt: string;
  updatedAt: string;
  // Derived (not persisted):
  lastInteractionAt?: string;
  lastInteractionType?: Interaction["type"];
}

export interface Interaction {
  id: string;
  contactId: string;
  type: "call" | "coffee" | "text" | "voicenote" | "other";
  note?: string;
  aiSummary?: string;
  occurredAt: string;
  createdAt: string;
}

export interface NextTopic {
  id: string;
  contactId: string;
  topic: string;
  isDone: boolean;
  createdAt: string;
}

export interface SpecialDate {
  id: string;
  contactId: string;
  type: "birthday" | "anniversary" | "other";
  label?: string;
  month: number;
  day: number;
  createdAt: string;
}

export interface Gift {
  id: string;
  contactId: string;
  specialDateId?: string;
  name: string;
  isAiSuggested: boolean;
  givenAt?: string;
  createdAt: string;
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
  completedAt: string | null;
  sortOrder: number;
  createdAt: string;
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
