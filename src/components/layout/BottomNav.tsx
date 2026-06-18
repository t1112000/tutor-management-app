"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "./nav-items";

export default function BottomNav() {
  const pathname = usePathname();

  const activeIndex = navItems.findIndex(({ href }) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href)
  );

  const count = navItems.length;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div
        className="absolute bottom-0 inset-x-0 pointer-events-none"
        style={{
          height: "env(safe-area-inset-bottom)",
          background: "rgba(255,255,255,0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      />
      <div className="mx-4 mb-3 pointer-events-auto">
        <div className="relative flex h-16 items-center rounded-full bg-white/95 backdrop-blur-sm border border-white shadow-[0_8px_32px_rgba(0,0,0,0.10),0_2px_8px_rgba(0,0,0,0.06)] px-1.5">

          {/* Sliding full-slot highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-[5px] rounded-full bg-primary/10 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
            style={{
              left: "6px",
              width: `calc((100% - 12px) / ${count})`,
              transform: `translateX(calc(${activeIndex} * 100%))`,
            }}
          />

          {navItems.map(({ href, icon: Icon, label }, index) => {
            const isActive = index === activeIndex;
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="relative z-10 flex flex-1 min-w-0 flex-col items-center justify-center gap-0.5"
              >
                <div
                  className={cn(
                    "transition-colors duration-200",
                    isActive ? "text-primary" : "text-gray-400"
                  )}
                >
                  <Icon size={21} strokeWidth={isActive ? 2 : 1.7} />
                </div>
                <span
                  className={cn(
                    "w-full truncate text-center text-[10px] leading-none transition-all duration-200",
                    isActive ? "font-semibold text-primary" : "font-normal text-gray-400"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
