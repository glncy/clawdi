import { Database } from "./client";
import { categories } from "./schema";

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

export async function seedDatabase(db: Database): Promise<void> {
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) return;

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      isDefault: 1,
      sortOrder: cat.sortOrder,
    }))
  );
}
