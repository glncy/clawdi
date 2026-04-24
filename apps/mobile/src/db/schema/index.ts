import { accounts } from "./accounts";
import { transactions } from "./transactions";
import { categories } from "./categories";
import { recurringBills } from "./recurringBills";
import { savingsGoals } from "./savingsGoals";
import { budgetSettings } from "./budgetSettings";
import { contacts } from "./contacts";
import { interactions } from "./interactions";
import { nextTopics } from "./nextTopics";
import { specialDates } from "./specialDates";
import { gifts } from "./gifts";
import { priorities } from "./priorities";
import { quickList } from "./quickList";
import { metadata } from "./metadata";

export { accounts } from "./accounts";
export { transactions } from "./transactions";
export { categories } from "./categories";
export { recurringBills } from "./recurringBills";
export { savingsGoals } from "./savingsGoals";
export { budgetSettings } from "./budgetSettings";
export { contacts } from "./contacts";
export { interactions } from "./interactions";
export { nextTopics } from "./nextTopics";
export { specialDates } from "./specialDates";
export { gifts } from "./gifts";
export { priorities } from "./priorities";
export { quickList } from "./quickList";
export { metadata } from "./metadata";

export type { AccountRow, NewAccount } from "./accounts";
export type { TransactionRow, NewTransaction } from "./transactions";
export type { CategoryRow, NewCategory } from "./categories";
export type { RecurringBillRow, NewRecurringBill } from "./recurringBills";
export type { SavingsGoalRow, NewSavingsGoal } from "./savingsGoals";
export type { BudgetSettingRow, NewBudgetSetting } from "./budgetSettings";
export type { ContactRow, NewContact } from "./contacts";
export type { InteractionRow, NewInteraction } from "./interactions";
export type { NextTopicRow, NewNextTopic } from "./nextTopics";
export type { SpecialDateRow, NewSpecialDate } from "./specialDates";
export type { GiftRow, NewGift } from "./gifts";
export type { PriorityRow, NewPriority } from "./priorities";
export type { QuickListRow, NewQuickListItem } from "./quickList";
export type { MetadataRow, NewMetadata } from "./metadata";

export const schema = {
  accounts,
  transactions,
  categories,
  recurringBills,
  savingsGoals,
  budgetSettings,
  contacts,
  interactions,
  nextTopics,
  specialDates,
  gifts,
  priorities,
  quickList,
  metadata,
};
