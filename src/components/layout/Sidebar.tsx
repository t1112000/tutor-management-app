"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Trang chủ" },
  { href: "/students", icon: Users, label: "Học sinh" },
  { href: "/calendar", icon: Calendar, label: "Lịch dạy" },
  { href: "/report", icon: BarChart2, label: "Báo cáo" },
  { href: "/settings", icon: Settings, label: "Cài đặt" },
];

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase()
    : (user.email?.[0] ?? "U").toUpperCase();

  return (
    <aside className="w-[60px] min-h-screen bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-1 shrink-0">
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center mb-4 shrink-0">
        <span className="text-white font-bold text-lg">M</span>
      </div>

      <nav className="flex flex-col items-center gap-1 flex-1 w-full px-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              )}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </nav>

      <div
        className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-xs font-semibold shrink-0"
        title={user.name ?? user.email ?? ""}
      >
        {initials}
      </div>
    </aside>
  );
}
