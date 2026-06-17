"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { weekStartStr, addDaysStr, formatWeekRangeVN } from "@/lib/time";
import { findColor, hashColor } from "@/lib/student-colors";
import useIsMobile from "@/hooks/use-is-mobile";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Session {
  id: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  isAttended: boolean;
  bill: {
    id: number;
    student: {
      name: string;
      subject: "english" | "chinese";
      color: string | null;
      type: "offline" | "online" | null;
    };
  };
}

const HOUR_H = 40;
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

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const VN_DAY_NAMES_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

const SUBJECT_LABEL: Record<string, string> = {
  english: "Tiếng Anh",
  chinese: "Tiếng Trung",
};
const SUBJECT_STYLE: Record<string, React.CSSProperties> = {
  english: {
    background: "#FFF0F3",
    color: "#E8788A",
    border: "1px solid #F4D8DE",
  },
  chinese: {
    background: "#EFF6FF",
    color: "#3B82F6",
    border: "1px solid #BFDBFE",
  },
};

function formatDayMonth(dateStr: string) {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

export default function CalendarClient() {
  const isMobile = useIsMobile();
  const [weekStart, setWeekStart] = useState(() =>
    weekStartStr(new Date().toISOString().slice(0, 10)),
  );
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Session | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const days = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));

  // Init selected day index: today if in current week, else 0
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const ws = weekStartStr(todayStr);
    const initialDays = Array.from({ length: 7 }, (_, i) => addDaysStr(ws, i));
    const idx = initialDays.indexOf(todayStr);
    return idx >= 0 ? idx : 0;
  });

  useEffect(() => {
    setLoading(true);
    fetch(`/api/calendar?weekStart=${weekStart}`)
      .then((r) => r.json())
      .then(setSessions)
      .finally(() => setLoading(false));
  }, [weekStart]);

  // Dynamic grid height: end 1 hour after the latest session, minimum 20:00
  const latestEndHour =
    sessions.length > 0
      ? Math.max(...sessions.map((s) => Math.ceil(pt(s.endTime) / 60)))
      : GRID_S + GRID_HOURS;
  const gridEndHour = Math.max(latestEndHour + 1, GRID_S + 6);
  const dynamicHours = gridEndHour - GRID_S;
  const dynamicGridH = dynamicHours * HOUR_H;

  const navBtnStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    background: "#FFF8FA",
    border: "1px solid #F4D8DE",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flexShrink: 0,
  };

  // Sessions for the selected day (mobile)
  const selectedDayStr = days[selectedDayIndex];
  const sessionsForSelectedDay = sessions.filter(
    (s) => s.scheduledDate === selectedDayStr,
  );

  // Session detail modal content
  const renderSessionDetail = () => {
    if (!selected) return null;
    const student = selected.bill.student;
    const color = getColor(student);
    const initials =
      student.name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "?";
    return (
      <>
        {/* Student info */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: color.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 700,
              color: "rgba(44,24,32,0.75)",
              flexShrink: 0,
              boxShadow: `0 4px 12px ${color.shadow}`,
            }}
          >
            {initials}
          </div>
          <div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "#2C1820",
                marginBottom: 5,
              }}
            >
              {student.name}
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 6,
                padding: "3px 10px",
                ...SUBJECT_STYLE[student.subject],
              }}
            >
              {SUBJECT_LABEL[student.subject]}
            </span>
          </div>
        </div>

        {/* Date & time */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            background: "#FFF8FA",
            borderRadius: 14,
            padding: "16px 20px",
            border: "1px solid #F4D8DE",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#C4A0A8",
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Ngày
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#2C1820",
              }}
            >
              {formatDayMonth(selected.scheduledDate)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 11,
                color: "#C4A0A8",
                fontWeight: 600,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Giờ học
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#2C1820",
                fontFamily: "monospace",
              }}
            >
              {selected.startTime}–{selected.endTime}
            </div>
          </div>
        </div>

        {/* Link to bill */}
        <Link
          href={`/bills/${selected.bill.id}`}
          style={{
            display: "block",
            marginTop: 16,
            textAlign: "center",
            padding: "11px 0",
            background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
            borderRadius: 12,
            color: "white",
            fontWeight: 700,
            fontSize: 13,
            textDecoration: "none",
          }}
        >
          Xem hóa đơn
        </Link>
      </>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      {/* Sticky header */}
      <div
        style={{
          height: "64px",
          padding: isMobile ? "0 16px" : "0 32px",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #F4D8DE",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "#2C1820",
              letterSpacing: "-0.5px",
              margin: 0,
            }}
          >
            Lịch dạy
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => setWeekStart((ws) => addDaysStr(ws, -7))}
              style={navBtnStyle}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#62666d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 500,
                color: "#2C1820",
                minWidth: isMobile ? "120px" : "160px",
                textAlign: "center",
              }}
            >
              {formatWeekRangeVN(weekStart)}
            </span>
            <button
              onClick={() => setWeekStart((ws) => addDaysStr(ws, 7))}
              style={navBtnStyle}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#62666d"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile: day strip + sessions list */}
      {isMobile && (
        <>
          {/* Day strip */}
          <div
            style={{
              display: "flex",
              overflowX: "auto",
              gap: "6px",
              padding: "8px 16px",
              borderBottom: "1px solid #F4D8DE",
              background: "white",
              flexShrink: 0,
            }}
          >
            {days.map((day, i) => {
              const isSelected = i === selectedDayIndex;
              const isToday = day === today;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDayIndex(i)}
                  style={{
                    flexShrink: 0,
                    minWidth: "44px",
                    padding: "6px 4px",
                    borderRadius: "10px",
                    border: "none",
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(232,120,138,0.12)"
                      : "transparent",
                    color: isSelected ? "#E8788A" : "#6B4858",
                    fontWeight: isSelected ? 600 : 400,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  <span style={{ fontSize: "11px" }}>
                    {VN_DAY_NAMES_SHORT[i]}
                  </span>
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: isSelected ? 700 : 500,
                    }}
                  >
                    {new Date(day + "T00:00:00").getDate()}
                  </span>
                  {isToday && (
                    <div
                      style={{
                        width: "4px",
                        height: "4px",
                        borderRadius: "50%",
                        background: "#E8788A",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Sessions list for selected day */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 16px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#A87888",
                  fontSize: "13px",
                  paddingTop: "32px",
                }}
              >
                Đang tải...
              </div>
            ) : sessionsForSelectedDay.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  color: "#A87888",
                  fontSize: "13px",
                  paddingTop: "32px",
                }}
              >
                Không có buổi dạy
              </div>
            ) : (
              sessionsForSelectedDay.map((session) => {
                const color = getColor(session.bill.student);
                return (
                  <div
                    key={session.id}
                    onClick={() => setSelected(session)}
                    style={{
                      background: "white",
                      border: "1px solid #F4D8DE",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      cursor: "pointer",
                      borderLeft: `4px solid ${color.hex}`,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "14px",
                        color: "#2C1820",
                      }}
                    >
                      {session.bill.student.name}
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "#A87888",
                        marginTop: "3px",
                        fontFamily: "monospace",
                      }}
                    >
                      {session.startTime} – {session.endTime}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Desktop: 7-column grid */}
      {!isMobile && (
        <div
          style={{
            background: "white",
            border: "1px solid #F4D8DE",
            margin: "20px 32px 32px",
            borderRadius: "12px",
            paddingBottom: "40px",
          }}
        >
          {/* Day headers — sticky */}
          <div
            style={{
              display: "flex",
              borderBottom: "1px solid #F4D8DE",
              position: "sticky",
              top: 0,
              background: "#FFF8FA",
              zIndex: 5,
            }}
          >
            <div
              style={{
                width: "56px",
                flexShrink: 0,
                borderRight: "1px solid #F4D8DE",
              }}
            />
            {days.map((d, i) => {
              const isToday = d === today;
              const dateStr = d.slice(8) + "-" + d.slice(5, 7);
              return (
                <div
                  key={d}
                  style={{
                    flex: 1,
                    padding: "10px 0",
                    textAlign: "center",
                    borderRight: "1px solid #F4D8DE",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "#A87888",
                      textTransform: "uppercase",
                      letterSpacing: "0.4px",
                    }}
                  >
                    {DAY_NAMES[i]}
                  </div>
                  <div
                    style={
                      isToday
                        ? {
                            display: "inline-block",
                            marginTop: "4px",
                            background: "#E8788A",
                            color: "white",
                            borderRadius: "9999px",
                            padding: "2px 9px",
                            fontSize: "12px",
                            fontWeight: 700,
                            boxShadow: "0 2px 8px rgba(232,120,138,0.45)",
                          }
                        : {
                            display: "inline-block",
                            marginTop: "4px",
                            color: "#A87888",
                            padding: "2px 8px",
                            fontSize: "12px",
                          }
                    }
                  >
                    {dateStr}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid body */}
          <div
            style={{
              display: "flex",
              position: "relative",
              paddingTop: "20px",
            }}
          >
            {/* Time labels */}
            <div
              style={{
                width: "56px",
                flexShrink: 0,
                borderRight: "1px solid #F4D8DE",
                position: "relative",
                height: `${dynamicGridH}px`,
              }}
            >
              {Array.from({ length: dynamicHours + 1 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    top: `${i * HOUR_H - 8}px`,
                    right: "6px",
                    fontSize: "10px",
                    color: "#9098a8",
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  {GRID_S + i}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            <div
              style={{
                flex: 1,
                display: "flex",
                height: `${dynamicGridH}px`,
                backgroundImage: `repeating-linear-gradient(to bottom, #F4D8DE 0px, #F4D8DE 1px, transparent 1px, transparent ${HOUR_H}px)`,
                backgroundSize: `100% ${HOUR_H}px`,
              }}
            >
              {days.map((d, i) => {
                const isToday = d === today;
                const daySessions = sessions.filter(
                  (s) => s.scheduledDate === d,
                );
                return (
                  <div
                    key={d}
                    style={{
                      flex: 1,
                      position: "relative",
                      borderRight: "1px solid #F4D8DE",
                      height: `${dynamicGridH}px`,
                      background: isToday
                        ? "rgba(232,120,138,0.04)"
                        : "transparent",
                      transition: "background 300ms ease",
                    }}
                  >
                    {!loading &&
                      daySessions.map((s) => {
                        const topPx =
                          ((pt(s.startTime) - GRID_S * 60) / 60) * HOUR_H;
                        const color = getColor(s.bill.student);
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelected(s)}
                            style={{
                              position: "absolute",
                              top: `${topPx}px`,
                              height: "auto",
                              left: "5px",
                              right: "5px",
                              background: color.bg,
                              borderRadius: "9px",
                              padding: "6px 9px 7px",
                              cursor: "pointer",
                              overflow: "hidden",
                              border: "none",
                              textAlign: "left",
                              boxShadow: `0 4px 14px ${color.shadow}, 0 1px 4px ${color.shadow}`,
                              transition:
                                "transform 140ms ease, box-shadow 140ms ease",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "3px",
                                background: "rgba(255,255,255,0.5)",
                                borderRadius: "9px 9px 0 0",
                              }}
                            />
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "rgba(44,24,32,0.85)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                marginTop: "2px",
                              }}
                            >
                              {s.bill.student.name}
                            </div>
                            <div
                              style={{
                                fontSize: "10px",
                                color: "rgba(44,24,32,0.55)",
                                marginTop: "1px",
                                fontFamily: "monospace",
                              }}
                            >
                              {s.startTime}–{s.endTime}
                            </div>
                            <div
                              style={{
                                fontSize: "9px",
                                color: "rgba(44,24,32,0.45)",
                                marginTop: "3px",
                                fontWeight: 500,
                              }}
                            >
                              {s.bill.student.type === "online"
                                ? "🌐 Online"
                                : "📍 Offline"}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Session detail modal — bottom sheet on mobile, centered dialog on desktop */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 24,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 16, color: "#2C1820" }}>
              Chi tiết buổi học
            </span>
          </div>
          {renderSessionDetail()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
