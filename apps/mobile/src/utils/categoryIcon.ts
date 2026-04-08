const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍽",
  Groceries: "🛒",
  Transport: "🚌",
  Shopping: "🛍",
  Bills: "📄",
  Health: "💊",
  Entertainment: "🎬",
  Other: "📦",
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category] ?? "📦";
}
