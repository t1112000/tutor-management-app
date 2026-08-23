import { Home, Users, Calendar, BarChart2, Settings, Package, Contact, ShoppingCart } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountType } from "@/lib/db/models/User";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  accountTypes: AccountType[];
}

const BOTH: AccountType[] = ["tutor", "reseller"];

export const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Trang chủ", accountTypes: BOTH },
  { href: "/students", icon: Users, label: "Học sinh", accountTypes: ["tutor"] },
  { href: "/calendar", icon: Calendar, label: "Lịch dạy", accountTypes: ["tutor"] },
  { href: "/inventory", icon: Package, label: "Kho tài khoản", accountTypes: ["reseller"] },
  { href: "/customers", icon: Contact, label: "Khách hàng", accountTypes: ["reseller"] },
  { href: "/orders", icon: ShoppingCart, label: "Đơn hàng", accountTypes: ["reseller"] },
  { href: "/report", icon: BarChart2, label: "Báo cáo", accountTypes: BOTH },
  { href: "/settings", icon: Settings, label: "Cài đặt", accountTypes: BOTH },
];

export function navItemsFor(accountType: AccountType): NavItem[] {
  return navItems.filter((item) => item.accountTypes.includes(accountType));
}
