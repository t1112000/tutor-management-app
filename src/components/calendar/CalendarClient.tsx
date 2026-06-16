"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { weekStartStr, addDaysStr, formatWeekRangeVN, vnDayName } from "@/lib/time";
import Link from "next/link";

interface Session {
  id: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  isAttended: boolean;
  bill: {
    id: number;
    student: { name: string; subject: "english" | "chinese" };
  };
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

const HOUR_START = 7;
const HOUR_END = 21;
const TOTAL_MINUTES = (HOUR_END - HOUR_START) * 60;
const GRID_HEIGHT = 600; // px

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

  function prevWeek() { setWeekStart((ws) => addDaysStr(ws, -7)); }
  function nextWeek() { setWeekStart((ws) => addDaysStr(ws, 7)); }

  function getSessionsForDay(date: string) {
    return sessions.filter((s) => s.scheduledDate === date);
  }

  function sessionStyle(s: Session) {
    const startMin = timeToMinutes(s.startTime) - HOUR_START * 60;
    const endMin = timeToMinutes(s.endTime) - HOUR_START * 60;
    const top = (startMin / TOTAL_MINUTES) * GRID_HEIGHT;
    const height = Math.max(((endMin - startMin) / TOTAL_MINUTES) * GRID_HEIGHT, 32);
    return { top: `${top}px`, height: `${height}px` };
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lịch dạy</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevWeek}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium text-gray-700 w-40 text-center">{formatWeekRangeVN(weekStart)}</span>
          <Button variant="outline" size="icon" onClick={nextWeek}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-gray-100 bg-pink-50/50">
          <div className="p-3" />
          {days.map((d, i) => {
            const isToday = d === today;
            const [, , day] = d.split("-");
            return (
              <div key={d} className="p-3 text-center">
                <div className="text-xs text-gray-400 font-medium">{vnDayName(new Date(d + "T00:00:00").getDay())}</div>
                <div className={`text-sm font-semibold mx-auto w-8 h-8 flex items-center justify-center rounded-full mt-1 ${isToday ? "bg-primary text-white" : "text-gray-700"}`}>
                  {parseInt(day)}
                </div>
                <div className="text-xs text-gray-400">{d.slice(5).replace("-", "/")}</div>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] overflow-y-auto" style={{ maxHeight: "600px" }}>
          {/* Time labels */}
          <div className="relative" style={{ height: `${GRID_HEIGHT}px` }}>
            {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
              <div
                key={i}
                className="absolute text-xs text-gray-400 text-right pr-3"
                style={{ top: `${(i / (HOUR_END - HOUR_START)) * GRID_HEIGHT - 8}px`, width: "100%" }}
              >
                {HOUR_START + i}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((d) => {
            const daySessions = getSessionsForDay(d);
            return (
              <div key={d} className="relative border-l border-gray-100" style={{ height: `${GRID_HEIGHT}px` }}>
                {/* Hour lines */}
                {Array.from({ length: HOUR_END - HOUR_START }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-t border-gray-50"
                    style={{ top: `${(i / (HOUR_END - HOUR_START)) * GRID_HEIGHT}px` }}
                  />
                ))}
                {/* Sessions */}
                {loading ? null : daySessions.map((s) => (
                  <Link key={s.id} href={`/bills/${s.bill.id}`}>
                    <div
                      className={`absolute left-1 right-1 rounded-lg px-2 py-1 text-white text-xs cursor-pointer overflow-hidden hover:opacity-90 transition-opacity ${
                        s.bill.student.subject === "english"
                          ? "bg-blue-400 hover:bg-blue-500"
                          : "bg-primary hover:bg-primary/90"
                      }`}
                      style={sessionStyle(s)}
                    >
                      <div className="font-semibold truncate">{s.bill.student.name}</div>
                      <div className="opacity-80">{s.startTime}–{s.endTime}</div>
                    </div>
                  </Link>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
