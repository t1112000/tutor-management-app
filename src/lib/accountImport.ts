import { z } from "zod";
import { dateStr } from "./validations";

export interface ParsedAccountLine {
  email: string;
  password: string;
  twoFactorSecret: string | null;
  expiryDate: string;
}

export type ParseAccountImportResult =
  | { ok: true; accounts: ParsedAccountLine[] }
  | { ok: false; errors: string[] };

const emailField = z.string().email();

export function parseAccountImportText(text: string): ParseAccountImportResult {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { ok: false, errors: ["Danh sách không được trống"] };

  const errors: string[] = [];
  const accounts: ParsedAccountLine[] = [];

  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const parts = line.split("|");
    if (parts.length !== 4) {
      errors.push(`Dòng ${lineNumber}: phải có đúng 4 phần cách nhau bởi "|" (email|password|2fa|ngày hết hạn)`);
      return;
    }

    const [email, password, twoFactorSecretRaw, expiryDate] = parts.map((p) => p.trim());
    const lineErrors: string[] = [];
    if (!emailField.safeParse(email).success) lineErrors.push("email không hợp lệ");
    if (!password) lineErrors.push("thiếu mật khẩu");
    if (!dateStr.safeParse(expiryDate).success) lineErrors.push("ngày hết hạn không hợp lệ (YYYY-MM-DD)");

    if (lineErrors.length > 0) {
      errors.push(`Dòng ${lineNumber}: ${lineErrors.join(", ")}`);
      return;
    }

    accounts.push({
      email,
      password,
      twoFactorSecret: twoFactorSecretRaw || null,
      expiryDate,
    });
  });

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, accounts };
}
