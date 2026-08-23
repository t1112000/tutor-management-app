import { addDaysStr } from "@/lib/time";

export type WarrantyType = "kbh" | "bhf" | "days";

export function computeWarrantyUntil(args: {
  type: WarrantyType;
  days: number | null;
  accountExpiryDate: string;
  orderDate: string;
}): string | null {
  if (args.type === "kbh") return null;
  if (args.type === "bhf") return args.accountExpiryDate;
  const n = args.days;
  if (n == null || n < 1) {
    throw new Error("warrantyDays must be >= 1 for type days");
  }
  return addDaysStr(args.orderDate, n);
}

export function isReplaceAllowed(args: {
  type: WarrantyType;
  warrantyUntil: string | null;
  today: string;
}): boolean {
  if (args.type === "kbh") return false;
  if (args.warrantyUntil == null) return false;
  return args.today <= args.warrantyUntil;
}
