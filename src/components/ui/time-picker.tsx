"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

interface TimePickerProps {
  label: string;
  value: string; // "HH:MM"
  onChange: (v: string) => void;
  onConfirm: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode; // trigger element
}

export function TimePicker({ label, value, onChange, onConfirm, open, onOpenChange, children }: TimePickerProps) {
  const parts = value.split(":");
  const h = parseInt(parts[0] ?? "7", 10);
  const m = parseInt(parts[1] ?? "0", 10);
  const minIdx = Math.max(0, MINUTES.indexOf(MINUTES.find((x) => x === m) ?? MINUTES[0]));

  function incHour() { onChange(`${pad((h + 1) % 24)}:${pad(MINUTES[minIdx])}`); }
  function decHour() { onChange(`${pad((h - 1 + 24) % 24)}:${pad(MINUTES[minIdx])}`); }
  function incMin() { onChange(`${pad(h)}:${pad(MINUTES[(minIdx + 1) % MINUTES.length])}`); }
  function decMin() { onChange(`${pad(h)}:${pad(MINUTES[(minIdx - 1 + MINUTES.length) % MINUTES.length])}`); }

  function handleConfirm() {
    onConfirm();
    // Don't call onOpenChange(false) here — parent's `open` prop closes the popover
    // when state transitions (start→end phase) or addPicker is set to null.
    // Calling it would race with onConfirm's setState and reset addPicker to null.
  }

  const arrowBtn: React.CSSProperties = {
    width: 48, height: 36, background: "#F8F0F4", border: "1px solid #F4D8DE",
    borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center",
    justifyContent: "center", fontSize: 12, color: "#A87888", flexShrink: 0,
  };

  const numBox: React.CSSProperties = {
    width: 64, height: 64, background: "#F8F0F4", border: "1px solid #F4D8DE",
    borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 36, fontWeight: 700, color: "#2C1820",
  };

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent
        style={{
          width: 260, padding: 24, borderRadius: 20,
          border: "1px solid #F4D8DE", boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
          background: "white",
        }}
      >
        <p style={{ fontWeight: 700, fontSize: 15, color: "#2C1820", margin: "0 0 20px" }}>{label}</p>

        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, justifyContent: "center", marginBottom: 20 }}>
          {/* Hours column */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <button style={arrowBtn} onClick={incHour}>▲</button>
            <div style={numBox}>{pad(h)}</div>
            <button style={arrowBtn} onClick={decHour}>▼</button>
            <span style={{ fontSize: 11, color: "#A87888", marginTop: 2 }}>giờ</span>
          </div>

          <span style={{ fontSize: 32, fontWeight: 700, color: "#2C1820", paddingTop: 40, lineHeight: 1 }}>:</span>

          {/* Minutes column */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
            <button style={arrowBtn} onClick={incMin}>▲</button>
            <div style={numBox}>{pad(MINUTES[minIdx])}</div>
            <button style={arrowBtn} onClick={decMin}>▼</button>
            <span style={{ fontSize: 11, color: "#A87888", marginTop: 2 }}>phút</span>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          style={{
            width: "100%", height: 36,
            background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
            border: "none", borderRadius: 10,
            color: "white", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}
        >
          Xác nhận
        </button>
      </PopoverContent>
    </Popover>
  );
}
