import { describe, expect, it } from "vitest";
import {
  billSchema,
  billUpdateSchema,
  dateStr,
  pushSubscriptionSchema,
  scheduleSchema,
  sessionUpdateSchema,
  signupSchema,
  timeStr,
} from "./validations";

describe("timeStr", () => {
  it("accepts real clock times", () => {
    for (const t of ["00:00", "09:05", "18:30", "23:59"]) {
      expect(timeStr.safeParse(t).success).toBe(true);
    }
  });

  it("rejects out-of-range values the plain digit pattern let through", () => {
    for (const t of ["25:99", "24:00", "07:60", "-1:00", "9:00", "18:0", ""]) {
      expect(timeStr.safeParse(t).success).toBe(false);
    }
  });
});

describe("dateStr", () => {
  it("accepts real calendar dates including leap days", () => {
    for (const d of ["2026-07-27", "2024-02-29", "2026-12-31"]) {
      expect(dateStr.safeParse(d).success).toBe(true);
    }
  });

  it("rejects impossible dates", () => {
    for (const d of ["2026-13-01", "2026-02-30", "2026-00-10", "2026-07-32", "27/07/2026"]) {
      expect(dateStr.safeParse(d).success).toBe(false);
    }
  });
});

describe("billUpdateSchema", () => {
  it("rejects a non-numeric amount instead of letting it reach Postgres", () => {
    expect(billUpdateSchema.safeParse({ totalAmount: "abc" }).success).toBe(false);
  });

  it("rejects zero and negative amounts", () => {
    expect(billUpdateSchema.safeParse({ totalAmount: 0 }).success).toBe(false);
    expect(billUpdateSchema.safeParse({ totalAmount: -100 }).success).toBe(false);
  });

  it("strips unknown keys so a request body cannot mass-assign columns", () => {
    const parsed = billUpdateSchema.parse({ totalAmount: 1000, status: "paid", createdBy: 99 });
    expect(parsed).toEqual({ totalAmount: 1000 });
  });
});

describe("sessionUpdateSchema", () => {
  it("accepts each field the UI sends on its own", () => {
    for (const body of [
      { isAttended: true },
      { scheduledDate: "2026-07-27" },
      { startTime: "18:00", endTime: "19:30" },
      { notes: "ghi chú" },
      { notes: null },
    ]) {
      expect(sessionUpdateSchema.safeParse(body).success).toBe(true);
    }
  });

  it("rejects malformed times", () => {
    expect(sessionUpdateSchema.safeParse({ startTime: "25:99" }).success).toBe(false);
  });
});

describe("scheduleSchema", () => {
  it("bounds dayOfWeek to 0-6", () => {
    expect(scheduleSchema.safeParse({ dayOfWeek: 0, startTime: "08:00", endTime: "09:00" }).success).toBe(true);
    expect(scheduleSchema.safeParse({ dayOfWeek: 6, startTime: "08:00", endTime: "09:00" }).success).toBe(true);
    expect(scheduleSchema.safeParse({ dayOfWeek: 7, startTime: "08:00", endTime: "09:00" }).success).toBe(false);
    expect(scheduleSchema.safeParse({ dayOfWeek: -1, startTime: "08:00", endTime: "09:00" }).success).toBe(false);
  });
});

describe("billSchema", () => {
  const valid = {
    studentId: 1,
    sessionCount: 2,
    totalAmount: 500000,
    startDate: "2026-07-27",
    sessions: [{ scheduledDate: "2026-07-27", startTime: "18:00", endTime: "19:30" }],
  };

  it("accepts a well-formed invoice", () => {
    expect(billSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects invalid session times nested in the array", () => {
    const bad = { ...valid, sessions: [{ ...valid.sessions[0], startTime: "99:00" }] };
    expect(billSchema.safeParse(bad).success).toBe(false);
  });
});

describe("signupSchema", () => {
  const valid = { email: "a@b.com", password: "123456", name: "Nguyễn Văn A", accountType: "tutor" as const };

  it("accepts a well-formed signup for either account type", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
    expect(signupSchema.safeParse({ ...valid, accountType: "reseller" }).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a too-short password", () => {
    expect(signupSchema.safeParse({ ...valid, password: "123" }).success).toBe(false);
  });

  it("rejects an account type outside the fixed set", () => {
    expect(signupSchema.safeParse({ ...valid, accountType: "admin" }).success).toBe(false);
  });
});

describe("pushSubscriptionSchema", () => {
  it("accepts a real browser subscription", () => {
    const sub = {
      endpoint: "https://fcm.googleapis.com/fcm/send/abc123",
      expirationTime: null,
      keys: { p256dh: "key", auth: "auth" },
    };
    expect(pushSubscriptionSchema.safeParse(sub).success).toBe(true);
  });

  it("rejects a non-HTTPS endpoint pointing at internal infrastructure", () => {
    const sub = { endpoint: "http://169.254.169.254/latest/meta-data", keys: { p256dh: "k", auth: "a" } };
    expect(pushSubscriptionSchema.safeParse(sub).success).toBe(false);
  });

  it("requires the encryption keys", () => {
    expect(pushSubscriptionSchema.safeParse({ endpoint: "https://fcm.googleapis.com/x" }).success).toBe(false);
  });
});
