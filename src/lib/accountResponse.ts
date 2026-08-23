import type { Account } from "@/lib/db/index";
import { decrypt } from "@/lib/crypto";

const UNREADABLE = "[không đọc được]";

/** Decrypts a field, falling back to a placeholder instead of throwing if the
 * stored ciphertext is corrupt — one bad row degrades gracefully rather than
 * 500ing the whole list. */
function safeDecrypt(value: string): string {
  try {
    return decrypt(value);
  } catch {
    return UNREADABLE;
  }
}

export interface AccountResponse {
  id: number;
  type: Account["type"];
  email: string;
  password: string;
  twoFactorSecret: string | null;
  expiryDate: string;
  quotaPercent: number | null;
  status: Account["status"];
  notes: string | null;
  createdAt: Date;
}

/** Shared response shape for `/api/accounts` and `/api/accounts/[id]`. */
export function toAccountResponse(account: Account): AccountResponse {
  return {
    id: account.id,
    type: account.type,
    email: account.email,
    password: safeDecrypt(account.passwordEncrypted),
    twoFactorSecret: account.twoFactorSecretEncrypted ? safeDecrypt(account.twoFactorSecretEncrypted) : null,
    expiryDate: account.expiryDate,
    quotaPercent: account.quotaPercent,
    status: account.status,
    notes: account.notes,
    createdAt: account.createdAt,
  };
}
