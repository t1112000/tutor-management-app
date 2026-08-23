import { describe, expect, it } from "vitest";
import { parseAccountImportText } from "./accountImport";

describe("parseAccountImportText", () => {
  it("parses valid multi-line input", () => {
    const text = [
      "user1@gmail.com|Pass123|ABCD1234|2027-01-15",
      "user2@gmail.com|Pass456||2027-02-20",
    ].join("\n");
    const result = parseAccountImportText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.accounts).toEqual([
      { email: "user1@gmail.com", password: "Pass123", twoFactorSecret: "ABCD1234", expiryDate: "2027-01-15" },
      { email: "user2@gmail.com", password: "Pass456", twoFactorSecret: null, expiryDate: "2027-02-20" },
    ]);
  });

  it("skips blank lines", () => {
    const text = "user1@gmail.com|Pass123|ABCD1234|2027-01-15\n\n\n";
    const result = parseAccountImportText(text);
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.accounts).toHaveLength(1);
  });

  it("rejects a line with the wrong number of fields", () => {
    const result = parseAccountImportText("user1@gmail.com|Pass123|2027-01-15");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("Dòng 1");
  });

  it("rejects an invalid email", () => {
    const result = parseAccountImportText("not-an-email|Pass123||2027-01-15");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("email không hợp lệ");
  });

  it("rejects a missing password", () => {
    const result = parseAccountImportText("user1@gmail.com||ABCD1234|2027-01-15");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("thiếu mật khẩu");
  });

  it("rejects an invalid expiry date", () => {
    const result = parseAccountImportText("user1@gmail.com|Pass123||2027-13-99");
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("ngày hết hạn không hợp lệ");
  });

  it("reports every bad line, not just the first", () => {
    const text = [
      "not-an-email|Pass123||2027-01-15",
      "user2@gmail.com||ABCD1234|2027-01-15",
    ].join("\n");
    const result = parseAccountImportText(text);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]).toContain("Dòng 1");
    expect(result.errors[1]).toContain("Dòng 2");
  });

  it("rejects empty input", () => {
    const result = parseAccountImportText("   \n  \n");
    expect(result.ok).toBe(false);
  });

  it("numbers lines correctly when a blank line precedes an error", () => {
    const text = "\nnot-an-email|Pass123||2027-01-15";
    const result = parseAccountImportText(text);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("expected error");
    expect(result.errors[0]).toContain("Dòng 2");
  });
});
