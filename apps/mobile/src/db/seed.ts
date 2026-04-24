import { Database } from "./client";
import { accountTypes, categories } from "./schema";

const DEFAULT_CATEGORIES = [
  { id: "cat-food", name: "Food", icon: "🍔", sortOrder: 0 },
  { id: "cat-groceries", name: "Groceries", icon: "🛒", sortOrder: 1 },
  { id: "cat-transport", name: "Transport", icon: "🚌", sortOrder: 2 },
  { id: "cat-shopping", name: "Shopping", icon: "🛍️", sortOrder: 3 },
  { id: "cat-bills", name: "Bills", icon: "📄", sortOrder: 4 },
  { id: "cat-health", name: "Health", icon: "💊", sortOrder: 5 },
  { id: "cat-entertainment", name: "Entertainment", icon: "🎬", sortOrder: 6 },
  { id: "cat-other", name: "Other", icon: "📦", sortOrder: 7 },
];

const BUILT_IN_ACCOUNT_TYPES = [
  { id: "type-checking", name: "Checking", icon: "💳", sortOrder: 0 },
  { id: "type-savings", name: "Savings", icon: "🏦", sortOrder: 1 },
  { id: "type-credit", name: "Credit", icon: "💰", sortOrder: 2 },
  { id: "type-cash", name: "Cash", icon: "💵", sortOrder: 3 },
  { id: "type-investment", name: "Investment", icon: "📈", sortOrder: 4 },
];

export async function seedCategories(db: Database): Promise<void> {
  const existing = await db.select().from(categories);
  if (existing.length > 0) return;

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      isDefault: 1,
      sortOrder: cat.sortOrder,
    })),
  );
}

export async function seedAccountTypes(db: Database): Promise<void> {
  const existing = await db.select().from(accountTypes);
  if (existing.length > 0) return;

  await db.insert(accountTypes).values(
    BUILT_IN_ACCOUNT_TYPES.map((t) => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      isDefault: 1,
      sortOrder: t.sortOrder,
    })),
  );
}

export async function seedDatabase(db: Database): Promise<void> {
  await seedCategories(db);
  await seedAccountTypes(db);
}
