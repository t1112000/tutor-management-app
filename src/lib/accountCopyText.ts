export interface CopyableAccount {
  type: "netflix" | "gpt_plus";
  email: string;
  password: string;
  twoFactorSecret: string | null;
  expiryDate: string;
}

function formatOne(account: CopyableAccount): string {
  const lines = [
    `Email: ${account.email}`,
    `Mật khẩu: ${account.password}`,
  ];
  if (account.twoFactorSecret) lines.push(`2FA: ${account.twoFactorSecret}`);
  lines.push(`Hạn dùng: ${account.expiryDate}`);
  return lines.join("\n");
}

export function buildAccountCopyText(accounts: CopyableAccount[]): string {
  return accounts.map(formatOne).join("\n---\n");
}
