import { Home, Users, Calendar, BarChart2, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

export const navItems: NavItem[] = [
  { href: "/", icon: Home, label: "Trang chủ" },
  { href: "/students", icon: Users, label: "Học sinh" },
  { href: "/calendar", icon: Calendar, label: "Lịch dạy" },
  { href: "/report", icon: BarChart2, label: "Báo cáo" },
  { href: "/settings", icon: Settings, label: "Cài đặt" },
];
