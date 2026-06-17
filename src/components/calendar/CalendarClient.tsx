"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { weekStartStr, addDaysStr, formatWeekRangeVN } from "@/lib/time";
import { findColor, hashColor } from "@/lib/student-colors";

interface Session {
  id: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  isAttended: boolean;
  bill: {
    id: number;
    student: { name: string; subject: "english" | "chinese"; color: string | null };
  };
}

const HOUR_H = 64;
const GRID_S = 7;
const GRID_HOURS = 13;
const GRID_H = GRID_HOURS * HOUR_H;

function getColor(student: { name: string; color: string | null }) {
  if (student.color) return findColor(student.color);
  return hashColor(student.name);
}

function pt(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const hdrStyle: React.CSSProperties = {
  height: "64px", padding: "0 32px", display: "flex", alignItems: "center",
  borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0,
};

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

export default function CalendarClient() {
  const [weekStart, setWeekStart] = useState(() => weekStartStr(new Date().toISOString().slice(0, 10)));
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [weekStart]);

  const days = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));
  const today = new Date().toISOString().slice(0, 10);

  const navBtnStyle: React.CSSProperties = {
    width: "32px", height: "32px", background: "#FFF8FA", border: "1px solid #F4D8DE",
    borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      {/* Sticky header */}
      <div style={hdrStyle}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#2C1820", letterSpacing: "-0.5px", margin: 0 }}>
            Lịch dạy
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button onClick={() => setWeekStart((ws) => addDaysStr(ws, -7))} style={navBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#2C1820", minWidth: "160px", textAlign: "center" }}>
              {formatWeekRangeVN(weekStart)}
            </span>
            <button onClick={() => setWeekStart((ws) => addDaysStr(ws, 7))} style={navBtnStyle}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div style={{ flex: 1, overflow: "auto", background: "white", border: "1px solid #F4D8DE", margin: "20px 32px", borderRadius: "12px" }}>
        {/* Day headers — sticky */}
        <div style={{ display: "flex", borderBottom: "1px solid #F4D8DE", position: "sticky", top: 0, background: "#FFF8FA", zIndex: 5 }}>
          <div style={{ width: "56px", flexShrink: 0, borderRight: "1px solid #F4D8DE" }} />
          {days.map((d, i) => {
            const isToday = d === today;
            const dateStr = d.slice(8) + "-" + d.slice(5, 7);
            return (
              <div key={d} style={{ flex: 1, padding: "10px 0", textAlign: "center", borderRight: "1px solid #F4D8DE" }}>
                <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                  {DAY_NAMES[i]}
                </div>
                <div
                  style={isToday
                    ? { display: "inline-block", marginTop: "4px", background: "#E8788A", color: "white", borderRadius: "9999px", padding: "2px 9px", fontSize: "12px", fontWeight: 700, boxShadow: "0 2px 8px rgba(232,120,138,0.45)" }
                    : { display: "inline-block", marginTop: "4px", color: "#A87888", padding: "2px 8px", fontSize: "12px" }
                  }
                >
                  {dateStr}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grid body */}
        <div style={{ display: "flex", position: "relative", paddingTop: "20px" }}>
          {/* Time labels */}
          <div style={{ width: "56px", flexShrink: 0, borderRight: "1px solid #F4D8DE", position: "relative", height: `${GRID_H}px` }}>
            {Array.from({ length: 14 }, (_, i) => (
              <div
                key={i}
                style={{ position: "absolute", top: `${i * HOUR_H - 8}px`, right: "6px", fontSize: "10px", color: "#9098a8", lineHeight: 1, whiteSpace: "nowrap" }}
              >
                {GRID_S + i}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div
            style={{
              flex: 1, display: "flex", height: `${GRID_H}px`,
              backgroundImage: `repeating-linear-gradient(to bottom, #F4D8DE 0px, #F4D8DE 1px, transparent 1px, transparent ${HOUR_H}px)`,
              backgroundSize: `100% ${HOUR_H}px`,
            }}
          >
            {days.map((d, i) => {
              const isToday = d === today;
              const daySessions = sessions.filter((s) => s.scheduledDate === d);
              return (
                <div
                  key={d}
                  style={{
                    flex: 1, position: "relative", borderRight: "1px solid #F4D8DE",
                    height: `${GRID_H}px`,
                    background: isToday ? "rgba(232,120,138,0.04)" : "transparent",
                    transition: "background 300ms ease",
                  }}
                >
                  {!loading && daySessions.map((s) => {
                    const topPx = (pt(s.startTime) - GRID_S * 60) / 60 * HOUR_H;
                    const heightPx = Math.max((pt(s.endTime) - pt(s.startTime)) / 60 * HOUR_H - 4, 28);
                    const color = getColor(s.bill.student);
                    return (
                      <Link key={s.id} href={`/bills/${s.bill.id}`} style={{ textDecoration: "none" }}>
                        <div
                          style={{
                            position: "absolute", top: `${topPx}px`, height: `${heightPx}px`,
                            left: "5px", right: "5px",
                            background: color.bg, borderRadius: "9px", padding: "7px 9px 5px",
                            cursor: "pointer", overflow: "hidden",
                            boxShadow: `0 4px 14px ${color.shadow}, 0 1px 4px ${color.shadow}`,
                            border: "1px solid rgba(255,255,255,0.22)",
                            transition: "transform 140ms ease, box-shadow 140ms ease",
                          }}
                        >
                          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: "rgba(255,255,255,0.32)", borderRadius: "9px 9px 0 0" }} />
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textShadow: "0 1px 3px rgba(0,0,0,0.18)", marginTop: "2px" }}>
                            {s.bill.student.name}
                          </div>
                          <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.88)", marginTop: "2px", fontFamily: "monospace" }}>
                            {s.startTime}–{s.endTime}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
