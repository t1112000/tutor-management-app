import { describe, expect, it } from "vitest";
import { generateSessions, type SessionSlot } from "./generateSessions";

const monday: SessionSlot = { dayOfWeek: 1, startTime: "18:00", endTime: "19:30" };
const wednesday: SessionSlot = { dayOfWeek: 3, startTime: "08:00", endTime: "09:30" };

describe("generateSessions", () => {
  it("returns nothing when there is no schedule", () => {
    expect(generateSessions("2026-07-27", 4, [])).toEqual([]);
  });

  it("returns nothing for a non-positive session count", () => {
    expect(generateSessions("2026-07-27", 0, [monday])).toEqual([]);
    expect(generateSessions("2026-07-27", -1, [monday])).toEqual([]);
  });

  it("generates exactly the requested number of sessions", () => {
    expect(generateSessions("2026-07-27", 4, [monday])).toHaveLength(4);
    expect(generateSessions("2026-07-27", 8, [monday, wednesday])).toHaveLength(8);
  });

  it("repeats a single weekly slot every 7 days starting on the start date", () => {
    const sessions = generateSessions("2026-07-27", 3, [monday]);
    expect(sessions.map((s) => s.scheduledDate)).toEqual([
      "2026-07-27",
      "2026-08-03",
      "2026-08-10",
    ]);
    expect(sessions.every((s) => s.startTime === "18:00" && s.endTime === "19:30")).toBe(true);
  });

  it("includes the start date itself when it matches a slot", () => {
    const [first] = generateSessions("2026-07-27", 1, [monday]);
    expect(first.scheduledDate).toBe("2026-07-27");
  });

  it("skips forward when the start date is not a scheduled day", () => {
    // 2026-07-28 is a Tuesday; the next Monday slot is 2026-08-03.
    const [first] = generateSessions("2026-07-28", 1, [monday]);
    expect(first.scheduledDate).toBe("2026-08-03");
  });

  it("orders multiple weekly slots chronologically", () => {
    const sessions = generateSessions("2026-07-27", 4, [wednesday, monday]);
    expect(sessions.map((s) => s.scheduledDate)).toEqual([
      "2026-07-27", // Mon
      "2026-07-29", // Wed
      "2026-08-03", // Mon
      "2026-08-05", // Wed
    ]);
  });

  it("emits multiple slots on the same day in start-time order", () => {
    const morning: SessionSlot = { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" };
    const evening: SessionSlot = { dayOfWeek: 1, startTime: "18:00", endTime: "19:00" };
    const sessions = generateSessions("2026-07-27", 2, [evening, morning]);
    expect(sessions).toEqual([
      { scheduledDate: "2026-07-27", startTime: "08:00", endTime: "09:00" },
      { scheduledDate: "2026-07-27", startTime: "18:00", endTime: "19:00" },
    ]);
  });

  it("crosses month and year boundaries without drifting", () => {
    const sessions = generateSessions("2026-12-28", 3, [monday]);
    expect(sessions.map((s) => s.scheduledDate)).toEqual([
      "2026-12-28",
      "2027-01-04",
      "2027-01-11",
    ]);
  });

  it("produces dates that round-trip as real calendar dates", () => {
    for (const s of generateSessions("2026-01-31", 20, [monday, wednesday])) {
      expect(s.scheduledDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const [y, m, d] = s.scheduledDate.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      expect(dt.getUTCDate()).toBe(d);
      expect(dt.getUTCMonth()).toBe(m - 1);
    }
  });
});
