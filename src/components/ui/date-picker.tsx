"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronLeft, ChevronRight } from "lucide-react";

const VN_DAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

interface DatePickerProps {
  value: string; // YYYY-MM-DD or ""
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  trigger?: React.ReactNode; // custom trigger element; if omitted, uses default button
}

function toDateStr(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function todayStr(): string {
  const t = new Date();
  return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

export function DatePicker({ value, onChange, placeholder = "Chọn ngày", style, trigger }: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const parsed = value ? new Date(value + "T00:00:00") : null;
  const now = new Date();

  const [viewYear, setViewYear] = useState(parsed?.getFullYear() ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? now.getMonth());

  useEffect(() => {
    if (value) {
      const d = new Date(value + "T00:00:00");
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  }

  function selectDay(year: number, month: number, day: number) {
    onChange(toDateStr(year, month, day));
    setOpen(false);
  }

  // Build 6×7 calendar grid
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells: Array<{ year: number; month: number; day: number; current: boolean }> = [];

  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const prevM = viewMonth === 0 ? 11 : viewMonth - 1;
    const prevY = viewMonth === 0 ? viewYear - 1 : viewYear;
    cells.push({ year: prevY, month: prevM, day: daysInPrevMonth - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ year: viewYear, month: viewMonth, day: d, current: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const nextM = viewMonth === 11 ? 0 : viewMonth + 1;
    const nextY = viewMonth === 11 ? viewYear + 1 : viewYear;
    cells.push({ year: nextY, month: nextM, day: d, current: false });
  }

  const today = todayStr();

  const displayValue = parsed
    ? `${String(parsed.getDate()).padStart(2, "0")}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${parsed.getFullYear()}`
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            style={{
              width: "100%", height: 40, padding: "0 12px",
              background: "#FFF8FA", border: "1px solid #ECC8D0",
              borderRadius: 10, textAlign: "left", cursor: "pointer",
              fontSize: 14, color: displayValue ? "#2C1820" : "#C4A0A8",
              display: "flex", alignItems: "center",
              ...style,
            }}
          >
            {displayValue || placeholder}
          </button>
        )}
      </PopoverTrigger>

      <PopoverContent
        align="start"
        style={{
          width: 300, padding: 20, borderRadius: 20,
          border: "1px solid #F4D8DE",
          boxShadow: "0 8px 32px rgba(232,120,138,0.12)",
          background: "white",
        }}
      >
        {/* Month navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button
            onClick={prevMonth}
            style={{ width: 32, height: 32, background: "#F4F6FB", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={16} color="#6B7280" />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#2C1820" }}>
            Tháng {viewMonth + 1} {viewYear}
          </span>
          <button
            onClick={nextMonth}
            style={{ width: 32, height: 32, background: "#F4F6FB", border: "none", borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronRight size={16} color="#6B7280" />
          </button>
        </div>

        {/* Day-of-week headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {VN_DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: 600, color: "#A87888", padding: "4px 0" }}>
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {cells.map((c, i) => {
            const cs = toDateStr(c.year, c.month, c.day);
            const isSelected = cs === value;
            const isToday = cs === today;
            return (
              <button
                key={i}
                onClick={() => selectDay(c.year, c.month, c.day)}
                style={{
                  height: 36, width: "100%", border: "none", cursor: "pointer",
                  borderRadius: 8, fontSize: 13,
                  fontWeight: isSelected || isToday ? 700 : 400,
                  background: isSelected ? "#E8788A" : isToday ? "#FFE8EC" : "transparent",
                  color: isSelected ? "white" : isToday ? "#E8788A" : c.current ? "#2C1820" : "#D4A0B0",
                  transition: "background 100ms ease",
                }}
              >
                {c.day}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
