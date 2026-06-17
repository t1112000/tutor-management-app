import { formatInTimeZone } from "date-fns-tz";
import { addDays, format, startOfWeek, endOfWeek } from "date-fns";

export const VN_TZ = "Asia/Ho_Chi_Minh";

export function todayVN(): string {
  return formatInTimeZone(new Date(), VN_TZ, "yyyy-MM-dd");
}

export function vnWeekday(dateStr: string): number {
  return new Date(dateStr + "T00:00:00").getDay();
}

export function addDaysStr(dateStr: string, days: number): string {
  return format(addDays(new Date(dateStr + "T00:00:00"), days), "yyyy-MM-dd");
}

export function weekStartStr(dateStr: string): string {
  return format(
    startOfWeek(new Date(dateStr + "T00:00:00"), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
}

export function weekEndStr(dateStr: string): string {
  return format(
    endOfWeek(new Date(dateStr + "T00:00:00"), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
}

export function formatMoneyVND(amount: number | string): string {
  return new Intl.NumberFormat("vi-VN").format(Number(amount)) + " đ";
}

export function formatDateVN(dateStr: string): string {
  return format(new Date(dateStr + "T00:00:00"), "dd/MM/yyyy");
}

export function formatWeekRangeVN(ws: string): string {
  const start = new Date(ws + "T00:00:00");
  const end = addDays(start, 6);
  return `${format(start, "dd/MM")} – ${format(end, "dd/MM/yyyy")}`;
}

export const VN_DAY_NAMES = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export function vnDayName(dow: number): string {
  return VN_DAY_NAMES[dow] ?? "";
}
