import { canonicalHash, dayBucket, buildInsightCacheKey } from "../financeInsightCacheKey";

describe("financeInsightCacheKey", () => {
  it("canonicalHash is stable regardless of key order", () => {
    const a = { x: 1, y: 2 };
    const b = { y: 2, x: 1 };
    expect(canonicalHash(a)).toBe(canonicalHash(b));
  });
  it("dayBucket boundaries", () => {
    expect(dayBucket(new Date("2026-04-24T05:00:00Z"))).toBe("morning");
    expect(dayBucket(new Date("2026-04-24T11:59:00Z"))).toBe("morning");
    expect(dayBucket(new Date("2026-04-24T12:00:00Z"))).toBe("afternoon");
    expect(dayBucket(new Date("2026-04-24T17:59:00Z"))).toBe("afternoon");
    expect(dayBucket(new Date("2026-04-24T18:00:00Z"))).toBe("evening");
    expect(dayBucket(new Date("2026-04-24T04:59:00Z"))).toBe("evening");
  });
  it("buildInsightCacheKey combines them", () => {
    const snap = { a: 1 };
    const key = buildInsightCacheKey(snap, new Date("2026-04-24T09:00:00Z"));
    expect(key).toMatch(/^insight:[a-f0-9]+:morning$/);
  });
});
