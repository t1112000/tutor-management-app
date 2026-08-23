import { describe, expect, it } from "vitest";
import { computeWarrantyUntil, isReplaceAllowed } from "./orderWarranty";

describe("computeWarrantyUntil", () => {
  it("returns null for kbh", () => {
    expect(
      computeWarrantyUntil({
        type: "kbh",
        days: null,
        accountExpiryDate: "2027-01-15",
        orderDate: "2026-08-23",
      })
    ).toBeNull();
  });

  it("returns the first account expiry for bhf", () => {
    expect(
      computeWarrantyUntil({
        type: "bhf",
        days: null,
        accountExpiryDate: "2027-01-15",
        orderDate: "2026-08-23",
      })
    ).toBe("2027-01-15");
  });

  it("adds N calendar days to the order date for days", () => {
    expect(
      computeWarrantyUntil({
        type: "days",
        days: 30,
        accountExpiryDate: "2027-01-15",
        orderDate: "2026-08-23",
      })
    ).toBe("2026-09-22");
  });

  it("treats days=1 as tomorrow", () => {
    expect(
      computeWarrantyUntil({
        type: "days",
        days: 1,
        accountExpiryDate: "2027-01-15",
        orderDate: "2026-08-23",
      })
    ).toBe("2026-08-24");
  });
});

describe("isReplaceAllowed", () => {
  it("is false for kbh even with a until date", () => {
    expect(isReplaceAllowed({ type: "kbh", warrantyUntil: "2026-09-01", today: "2026-08-23" })).toBe(false);
  });

  it("is false for kbh with null until", () => {
    expect(isReplaceAllowed({ type: "kbh", warrantyUntil: null, today: "2026-08-23" })).toBe(false);
  });

  it("is true for bhf when today equals warrantyUntil", () => {
    expect(isReplaceAllowed({ type: "bhf", warrantyUntil: "2026-08-23", today: "2026-08-23" })).toBe(true);
  });

  it("is false for bhf when today is after warrantyUntil", () => {
    expect(isReplaceAllowed({ type: "bhf", warrantyUntil: "2026-08-22", today: "2026-08-23" })).toBe(false);
  });

  it("is true for days when today is before warrantyUntil", () => {
    expect(isReplaceAllowed({ type: "days", warrantyUntil: "2026-09-22", today: "2026-08-23" })).toBe(true);
  });

  it("is false for days/bhf when warrantyUntil is null", () => {
    expect(isReplaceAllowed({ type: "days", warrantyUntil: null, today: "2026-08-23" })).toBe(false);
  });
});
