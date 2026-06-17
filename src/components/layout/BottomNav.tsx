"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white border-t border-border shadow-[0_-2px_10px_rgba(0,0,0,0.06)] pb-safe"
      style={{ height: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom))" }}
    >
      <div className="flex h-[64px]">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5",
                "transition-transform duration-150 ease-out active:scale-[0.92]",
                isActive ? "text-primary" : "text-gray-500"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center rounded-full px-3 py-1.5 transition-all duration-200",
                  isActive
                    ? "bg-primary/10 shadow-sm -translate-y-0.5"
                    : "active:bg-gray-100 active:shadow-inner"
                )}
              >
                <Icon size={22} className={isActive ? "drop-shadow-sm" : ""} />
              </div>
              <span
                className={cn(
                  "text-[10px] leading-none",
                  isActive ? "font-semibold" : "font-normal"
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
