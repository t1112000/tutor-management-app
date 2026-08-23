import { describe, expect, it } from "vitest";
import {
  accountSchema,
  accountUpdateSchema,
  accountImportSchema,
  billSchema,
  billUpdateSchema,
  copyTextSchema,
  customerSchema,
  dateStr,
  orderCopyTextSchema,
  orderCreateSchema,
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

describe("accountSchema", () => {
  const valid = {
    type: "netflix" as const,
    email: "user@gmail.com",
    password: "Pass123",
    expiryDate: "2027-01-15",
  };

  it("accepts a minimal valid netflix account", () => {
    expect(accountSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a gpt_plus account with quotaPercent and 2FA", () => {
    const gpt = { ...valid, type: "gpt_plus" as const, twoFactorSecret: "ABCD1234", quotaPercent: 80 };
    expect(accountSchema.safeParse(gpt).success).toBe(true);
  });

  it("rejects an invalid email", () => {
    expect(accountSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(accountSchema.safeParse({ ...valid, password: "" }).success).toBe(false);
  });

  it("rejects quotaPercent outside 0-100", () => {
    expect(accountSchema.safeParse({ ...valid, quotaPercent: 150 }).success).toBe(false);
    expect(accountSchema.safeParse({ ...valid, quotaPercent: -1 }).success).toBe(false);
  });

  it("rejects a type outside the fixed set", () => {
    expect(accountSchema.safeParse({ ...valid, type: "hulu" }).success).toBe(false);
  });
});

describe("accountUpdateSchema", () => {
  it("accepts a partial update", () => {
    expect(accountUpdateSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("accepts clearing twoFactorSecret with null", () => {
    expect(accountUpdateSchema.safeParse({ twoFactorSecret: null }).success).toBe(true);
  });

  it("strips status (status is not client-writable)", () => {
    const parsed = accountUpdateSchema.parse({ status: "sold", email: "a@b.com" });
    expect(parsed).toEqual({ email: "a@b.com" });
  });
});

describe("accountImportSchema", () => {
  it("accepts a type and non-empty text", () => {
    expect(accountImportSchema.safeParse({ type: "netflix", text: "a@b.com|p|2fa|2027-01-01" }).success).toBe(true);
  });

  it("rejects empty text", () => {
    expect(accountImportSchema.safeParse({ type: "netflix", text: "" }).success).toBe(false);
  });
});

describe("customerSchema", () => {
  it("accepts name only", () => {
    expect(customerSchema.safeParse({ name: "An" }).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(customerSchema.safeParse({ name: "  " }).success).toBe(false);
  });

  it("rejects two contacts of the same type", () => {
    expect(
      customerSchema.safeParse({
        name: "An",
        contacts: [
          { type: "zalo", value: "0901" },
          { type: "zalo", value: "0902" },
        ],
      }).success
    ).toBe(false);
  });

  it("accepts one of each contact type", () => {
    expect(
      customerSchema.safeParse({
        name: "An",
        contacts: [
          { type: "facebook", value: "https://facebook.com/an" },
          { type: "zalo", value: "0901234567" },
          { type: "discord", value: "an#1234" },
          { type: "telegram", value: "@an" },
        ],
      }).success
    ).toBe(true);
  });
});

describe("orderCreateSchema", () => {
  const line = { accountId: 1, warrantyType: "kbh" as const, price: 50000 };

  it("requires customerId or customer", () => {
    expect(orderCreateSchema.safeParse({ lines: [line] }).success).toBe(false);
  });

  it("rejects both customerId and customer", () => {
    expect(
      orderCreateSchema.safeParse({ customerId: 1, customer: { name: "An" }, lines: [line] }).success
    ).toBe(false);
  });

  it("accepts existing customerId", () => {
    expect(orderCreateSchema.safeParse({ customerId: 1, lines: [line] }).success).toBe(true);
  });

  it("accepts inline customer", () => {
    expect(orderCreateSchema.safeParse({ customer: { name: "An" }, lines: [line] }).success).toBe(true);
  });

  it("requires warrantyDays for type days", () => {
    expect(
      orderCreateSchema.safeParse({
        customerId: 1,
        lines: [{ accountId: 1, warrantyType: "days", price: 0 }],
      }).success
    ).toBe(false);
  });

  it("rejects warrantyDays unless type is days", () => {
    expect(
      orderCreateSchema.safeParse({
        customerId: 1,
        lines: [{ accountId: 1, warrantyType: "kbh", warrantyDays: 7, price: 0 }],
      }).success
    ).toBe(false);
  });

  it("rejects duplicate accountId in lines", () => {
    expect(
      orderCreateSchema.safeParse({
        customerId: 1,
        lines: [line, { ...line }],
      }).success
    ).toBe(false);
  });

  it("rejects empty lines", () => {
    expect(orderCreateSchema.safeParse({ customerId: 1, lines: [] }).success).toBe(false);
  });
});

describe("copyTextSchema", () => {
  it("requires at least one id", () => {
    expect(copyTextSchema.safeParse({ ids: [] }).success).toBe(false);
    expect(copyTextSchema.safeParse({ ids: [1] }).success).toBe(true);
  });
});

describe("orderCopyTextSchema", () => {
  it("allows omitted ids", () => {
    expect(orderCopyTextSchema.safeParse({}).success).toBe(true);
  });

  it("allows a list of ids", () => {
    expect(orderCopyTextSchema.safeParse({ ids: [1, 2] }).success).toBe(true);
  });
});
