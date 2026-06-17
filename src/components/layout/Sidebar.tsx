"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("myclass-sidebar");
      if (saved !== null) setExpanded(saved === "true");
    } catch {}
  }, []);

  function toggle() {
    setExpanded((v) => {
      const next = !v;
      try { localStorage.setItem("myclass-sidebar", String(next)); } catch {}
      return next;
    });
  }

  const initials = user.name
    ? user.name.split(" ").map((n) => n[0]).slice(-2).join("").toUpperCase()
    : (user.email?.[0] ?? "U").toUpperCase();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-white border-r border-border shrink-0 transition-[width] duration-200 overflow-hidden",
        expanded ? "w-[240px]" : "w-[56px]"
      )}
    >
      {/* Header */}
      {expanded ? (
        <div className="flex items-center gap-2.5 px-3 h-16 border-b border-border shrink-0">
          <Image src="/logo-myclass.png" alt="MyClass" width={36} height={36} className="rounded-lg shrink-0" />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-sm font-semibold text-[#2C1820] leading-tight truncate">MyClass</span>
            <span className="text-[11px] text-[#A87888] leading-tight truncate">Quản lý dạy học</span>
          </div>
          <button
            onClick={toggle}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#A87888] hover:bg-primary/10 transition-colors shrink-0"
            title="Thu gọn"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      ) : (
        <button
          onClick={toggle}
          title="Mở rộng"
          className="h-16 w-full flex items-center justify-center border-b border-border shrink-0 transition-colors hover:bg-[rgba(232,120,138,0.06)]"
        >
          <Image src="/logo-myclass.png" alt="MyClass" width={36} height={36} className="rounded-lg shrink-0" />
        </button>
      )}

      {/* Nav */}
      <nav className={cn(
        "flex flex-col flex-1 py-3 overflow-y-auto",
        expanded ? "gap-0.5 px-2" : "gap-1 px-2 items-center"
      )}>
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className={cn(
                "flex items-center rounded-xl transition-colors",
                expanded ? "gap-2.5 px-3 py-2 w-full" : "justify-center w-10 h-10",
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              )}
            >
              <Icon size={20} className="shrink-0" />
              {expanded && <span className="text-sm truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border shrink-0">
        {!expanded && (
          <button
            onClick={toggle}
            className="w-full py-3 flex items-center justify-center text-[#A87888] hover:bg-primary/10 transition-colors border-b border-border"
            title="Mở rộng"
          >
            <ChevronRight size={16} />
          </button>
        )}
        <div className={cn(
          "flex items-center gap-2.5 px-3 py-3",
          !expanded && "justify-center px-0"
        )}>
          <div
            className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-300 flex items-center justify-center text-white text-xs font-semibold shrink-0"
            title={user.name ?? user.email ?? ""}
          >
            {initials}
          </div>
          {expanded && (
            <>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[13px] font-medium text-[#2C1820] truncate leading-tight">
                  {user.name ?? user.email ?? "Người dùng"}
                </span>
                <span className="text-[11px] text-[#A87888] leading-tight">Giáo viên</span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#A87888] hover:bg-red-50 hover:text-red-400 transition-colors shrink-0"
                title="Đăng xuất"
              >
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
        {!expanded && (
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="w-full py-2.5 flex items-center justify-center text-[#A87888] hover:bg-red-50 hover:text-red-400 transition-colors border-t border-border"
            title="Đăng xuất"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
}
