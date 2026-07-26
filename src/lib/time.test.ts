import { afterEach, describe, expect, it, vi } from "vitest";
import { todayVN, hourVN, weekStartStr, weekEndStr, addDaysStr, formatMoneyVND, vnWeekday } from "./time";

afterEach(() => {
  vi.useRealTimers();
});

describe("todayVN", () => {
  it("returns the Vietnam date, not the UTC date, late in the UTC evening", () => {
    // 2026-07-26 22:00 UTC is already 2026-07-27 05:00 in Vietnam. This is the
    // window (00:00–07:00 VN) where the old toISOString() code showed yesterday.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T22:00:00Z"));

    expect(todayVN()).toBe("2026-07-27");
    expect(new Date().toISOString().slice(0, 10)).toBe("2026-07-26");
  });

  it("is stable across device timezones", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T22:00:00Z"));
    expect(todayVN()).toBe("2026-07-27");
  });

  it("does not roll over early", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T16:59:00Z")); // 23:59 VN on the 26th
    expect(todayVN()).toBe("2026-07-26");
  });
});

describe("hourVN", () => {
  it("reports the Vietnam hour", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-26T22:00:00Z")); // 05:00 VN
    expect(hourVN()).toBe(5);
  });
});

describe("weekStartStr / weekEndStr", () => {
  it("treats Monday as the first day of the week", () => {
    expect(weekStartStr("2026-07-27")).toBe("2026-07-27"); // a Monday
    expect(weekEndStr("2026-07-27")).toBe("2026-08-02");
  });

  it("maps Sunday back to the Monday that started its week", () => {
    // The bug this guards: a UTC-derived Sunday made weekStart and weekEnd the
    // same day, so the calendar API returned a one-day range.
    expect(weekStartStr("2026-08-02")).toBe("2026-07-27");
    expect(weekEndStr("2026-08-02")).toBe("2026-08-02");
  });

  it("produces a 7-day span for every day of the week", () => {
    for (let i = 0; i < 7; i++) {
      const day = addDaysStr("2026-07-27", i);
      const start = weekStartStr(day);
      expect(addDaysStr(start, 6)).toBe(weekEndStr(day));
    }
  });
});

describe("addDaysStr", () => {
  it("crosses month and year boundaries", () => {
    expect(addDaysStr("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDaysStr("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysStr("2026-03-01", -1)).toBe("2026-02-28");
  });
});

describe("vnWeekday", () => {
  it("returns 0 for Sunday through 6 for Saturday", () => {
    expect(vnWeekday("2026-07-26")).toBe(0); // Sunday
    expect(vnWeekday("2026-07-27")).toBe(1); // Monday
    expect(vnWeekday("2026-08-01")).toBe(6); // Saturday
  });
});

describe("formatMoneyVND", () => {
  it("formats numbers and numeric strings the same way", () => {
    expect(formatMoneyVND(500000)).toBe(formatMoneyVND("500000"));
    expect(formatMoneyVND(0)).toContain("0");
  });

  it("appends the currency suffix", () => {
    expect(formatMoneyVND(1000)).toMatch(/đ$/);
  });
});
