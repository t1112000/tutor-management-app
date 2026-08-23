import { describe, expect, it } from "vitest";
import { buildAccountCopyText } from "./accountCopyText";

describe("buildAccountCopyText", () => {
  it("formats a single account with 2FA", () => {
    const text = buildAccountCopyText([
      { type: "netflix", email: "user1@gmail.com", password: "Pass123", twoFactorSecret: "ABCD1234", expiryDate: "2027-01-15" },
    ]);
    expect(text).toBe(
      "Email: user1@gmail.com\nMật khẩu: Pass123\n2FA: ABCD1234\nHạn dùng: 2027-01-15"
    );
  });

  it("omits the 2FA line when null", () => {
    const text = buildAccountCopyText([
      { type: "gpt_plus", email: "user2@gmail.com", password: "Pass456", twoFactorSecret: null, expiryDate: "2027-02-20" },
    ]);
    expect(text).toBe("Email: user2@gmail.com\nMật khẩu: Pass456\nHạn dùng: 2027-02-20");
  });

  it("joins multiple accounts with a separator", () => {
    const text = buildAccountCopyText([
      { type: "netflix", email: "a@gmail.com", password: "p1", twoFactorSecret: null, expiryDate: "2027-01-01" },
      { type: "netflix", email: "b@gmail.com", password: "p2", twoFactorSecret: null, expiryDate: "2027-02-01" },
    ]);
    expect(text).toBe(
      "Email: a@gmail.com\nMật khẩu: p1\nHạn dùng: 2027-01-01\n---\nEmail: b@gmail.com\nMật khẩu: p2\nHạn dùng: 2027-02-01"
    );
  });

  it("returns an empty string for an empty list", () => {
    expect(buildAccountCopyText([])).toBe("");
  });
});
