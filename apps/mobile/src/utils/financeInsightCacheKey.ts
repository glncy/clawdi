function canonicalStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalStringify((value as Record<string, unknown>)[k])}`).join(",")}}`;
}

// djb2 — deterministic, no crypto dependency; fine for cache keys (not for security)
function djb2(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

export function canonicalHash(value: unknown): string {
  return djb2(canonicalStringify(value));
}

export type DayBucket = "morning" | "afternoon" | "evening";

export function dayBucket(now: Date = new Date()): DayBucket {
  const h = now.getUTCHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "evening";
}

export function buildInsightCacheKey(snapshot: unknown, now: Date = new Date()): string {
  return `insight:${canonicalHash(snapshot)}:${dayBucket(now)}`;
}
