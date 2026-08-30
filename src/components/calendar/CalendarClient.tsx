"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { weekStartStr, addDaysStr, formatWeekRangeVN, todayVN } from "@/lib/time";
import { findColor, hashColor } from "@/lib/student-colors";
import useIsMobile from "@/hooks/use-is-mobile";
import { useCalendar, useFixedCalendar } from "@/hooks/queries/use-calendar";
import { useUpdateSession } from "@/hooks/queries/use-bill";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface Session {
  id: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  isAttended: boolean;
  notes: string | null;
  bill: {
    id: number;
    status: "unpaid" | "paid";
    notes: string | null;
    student: {
      name: string;
      subject: "english" | "chinese";
      color: string | null;
      type: "offline" | "online" | null;
      address: string | null;
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
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

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

function CalendarLoadingView({ isMobile }: { isMobile: boolean }) {
  const headerStyle: React.CSSProperties = {
    height: "64px",
    padding: isMobile ? "0 16px" : "0 32px",
    display: "flex",
    alignItems: "center",
    borderBottom: "1px solid #F4D8DE",
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)",
    flexShrink: 0,
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <div style={headerStyle}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="animate-pulse" style={{ height: 28, width: 120, borderRadius: 9999, background: "#F4D8DE" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: 8, background: "#F4D8DE" }} />
            <div className="animate-pulse" style={{ width: isMobile ? 120 : 160, height: 18, borderRadius: 9999, background: "#F4D8DE" }} />
            <div className="animate-pulse" style={{ width: 32, height: 32, borderRadius: 8, background: "#F4D8DE" }} />
          </div>
        </div>
      </div>

      {isMobile ? (
        <div style={{ flex: 1, overflow: "hidden", padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 4, padding: "8px 0 10px" }}>
            {Array.from({ length: 7 }, (_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  flex: 1,
                  height: 88,
                  borderRadius: 12,
                  background: "rgba(244,216,222,0.55)",
                  border: "1px solid rgba(244,216,222,0.9)",
                }}
              />
            ))}
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  height: i === 0 ? 104 : 86,
                  borderRadius: 14,
                  background: "rgba(255,255,255,0.82)",
                  border: "1px solid rgba(244,216,222,0.95)",
                }}
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: "hidden", padding: "20px 32px 32px" }}>
          <div
            className="animate-pulse"
            style={{
              height: "100%",
              minHeight: 620,
              borderRadius: 12,
              border: "1px solid #F4D8DE",
              background:
                "linear-gradient(180deg, rgba(255,248,250,0.92), rgba(255,255,255,0.94))",
              overflow: "hidden",
            }}
          >
            <div style={{ display: "flex", borderBottom: "1px solid #F4D8DE", background: "#FFF8FA" }}>
              <div style={{ width: 56, flexShrink: 0, borderRight: "1px solid #F4D8DE" }} />
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    minHeight: 94,
                    borderRight: i === 6 ? "none" : "1px solid #F4D8DE",
                  }}
                />
              ))}
            </div>

            <div style={{ display: "flex" }}>
              <div
                style={{
                  width: 56,
                  flexShrink: 0,
                  borderRight: "1px solid #F4D8DE",
                  minHeight: 660,
                }}
              >
                {Array.from({ length: 14 }, (_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 40,
                      paddingTop: i === 0 ? 6 : 0,
                      paddingRight: 8,
                      textAlign: "right",
                      color: "transparent",
                    }}
                  >
                    {7 + i}:00
                  </div>
                ))}
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 660,
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, rgba(244,216,222,0.95) 0px, rgba(244,216,222,0.95) 1px, transparent 1px, transparent 40px)",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CalendarClient() {
  const isMobile = useIsMobile();
  const [weekStart, setWeekStart] = useState(() => weekStartStr(todayVN()));
  const [showFixedSchedule, setShowFixedSchedule] = useState(false);
  const { data: sessions = [], isLoading: sessionsLoading } = useCalendar(
    weekStart,
    !showFixedSchedule,
  );
  const { data: fixedSessions = [], isLoading: fixedSessionsLoading } =
    useFixedCalendar(showFixedSchedule);
  const loading = showFixedSchedule ? fixedSessionsLoading : sessionsLoading;
  const [selected, setSelected] = useState<Session | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [startPickerOpen, setStartPickerOpen] = useState(false);
  const [endPickerOpen, setEndPickerOpen] = useState(false);

  // The hook also invalidates the bill detail; the old raw fetch here only
  // refreshed the calendar, so the bill page kept showing the old date/time.
  const { mutateAsync: updateSession, isPending: saving } = useUpdateSession(
    selected?.bill.id ?? 0,
  );

  function handleEdit() {
    if (!selected) return;
    setEditDate(selected.scheduledDate);
    setEditStart(selected.startTime);
    setEditEnd(selected.endTime);
    setEditNotes(selected.notes ?? "");
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  async function handleSave() {
    if (!selected) return;
    try {
      await updateSession({
        sessionId: selected.id,
        updates: {
          scheduledDate: editDate,
          startTime: editStart,
          endTime: editEnd,
          notes: editNotes || null,
        },
      });
      setSelected({
        ...selected,
        scheduledDate: editDate,
        startTime: editStart,
        endTime: editEnd,
        notes: editNotes || null,
      });
      setIsEditing(false);
      toast.success("Đã cập nhật buổi học");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Có lỗi xảy ra");
    }
  }

  const today = todayVN();
  const days = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));

  // Init selected day index: today if in current week, else 0
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const todayStr = todayVN();
    const ws = weekStartStr(todayStr);
    const initialDays = Array.from({ length: 7 }, (_, i) => addDaysStr(ws, i));
    const idx = initialDays.indexOf(todayStr);
    return idx >= 0 ? idx : 0;
  });

  // Dynamic grid height: end 1 hour after the latest session, minimum 20:00
  const displayedSessions = showFixedSchedule ? fixedSessions : sessions;
  const latestEndHour =
    displayedSessions.length > 0
      ? Math.max(...displayedSessions.map((s) => Math.ceil(pt(s.endTime) / 60)))
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
  const fixedSessionsForSelectedDay = fixedSessions.filter(
    (s) => s.dayOfWeek === DAY_VALUES[selectedDayIndex],
  );
  const calendarColumns = showFixedSchedule
    ? DAY_VALUES.map((dayOfWeek, index) => ({
        key: `fixed-${dayOfWeek}`,
        dayOfWeek,
        label: DAY_NAMES[index],
        date: null,
        isToday: false,
      }))
    : days.map((date, index) => ({
        key: date,
        dayOfWeek: null,
        label: DAY_NAMES[index],
        date,
        isToday: date === today,
      }));

  const fieldLabel: React.CSSProperties = {
    fontSize: 11,
    color: "#C4A0A8",
    fontWeight: 600,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  };

  const timePickerTriggerStyle: React.CSSProperties = {
    width: "100%",
    height: 40,
    background: "#FFF8FA",
    border: "1px solid #ECC8D0",
    borderRadius: 10,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    color: "#2C1820",
    fontFamily: "monospace",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (loading) {
    return <CalendarLoadingView isMobile={isMobile} />;
  }

  // Session detail modal content
  const renderSessionDetail = () => {
    if (!selected) return null;
    const student = selected.bill.student;
    const color = getColor(student);
    const initials =
      student.name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "?";
    return (
      <>
        {/* Student info — always shown */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 20,
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

        {isEditing ? (
          /* ── Edit mode ── */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Date */}
            <div>
              <div style={fieldLabel}>Ngày</div>
              <DatePicker value={editDate} onChange={setEditDate} />
            </div>

            {/* Start & end time */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={fieldLabel}>Giờ bắt đầu</div>
                <TimePicker
                  label="Giờ bắt đầu"
                  value={editStart}
                  onChange={setEditStart}
                  onConfirm={() => setStartPickerOpen(false)}
                  open={startPickerOpen}
                  onOpenChange={setStartPickerOpen}
                >
                  <button type="button" style={timePickerTriggerStyle}>
                    {editStart}
                  </button>
                </TimePicker>
              </div>
              <div>
                <div style={fieldLabel}>Giờ kết thúc</div>
                <TimePicker
                  label="Giờ kết thúc"
                  value={editEnd}
                  onChange={setEditEnd}
                  onConfirm={() => setEndPickerOpen(false)}
                  open={endPickerOpen}
                  onOpenChange={setEndPickerOpen}
                >
                  <button type="button" style={timePickerTriggerStyle}>
                    {editEnd}
                  </button>
                </TimePicker>
              </div>
            </div>

            {/* Notes */}
            <div>
              <div style={fieldLabel}>Ghi chú</div>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Nhập ghi chú..."
                rows={3}
                style={{ resize: "none", fontSize: 13 }}
              />
            </div>

            {/* Save / Cancel */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  height: 40,
                  background: "#FFF8FA",
                  border: "1px solid #F4D8DE",
                  borderRadius: 10,
                  color: "#A87888",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  height: 40,
                  background: saving
                    ? "#F0A0B0"
                    : "linear-gradient(135deg,#E8788A,#F0A0B0)",
                  border: "none",
                  borderRadius: 10,
                  color: "white",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </div>
        ) : (
          /* ── View mode ── */
          <>
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
                <div style={fieldLabel}>Ngày</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2C1820" }}>
                  {formatDayMonth(selected.scheduledDate)}
                </div>
              </div>
              <div>
                <div style={fieldLabel}>Giờ học</div>
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

            {/* Teaching mode & address */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  student.type === "offline" && student.address
                    ? "auto 1fr"
                    : "1fr",
                gap: 10,
                marginTop: 10,
              }}
            >
              <div
                style={{
                  background: student.type === "online" ? "#EFF6FF" : "#F0FDF4",
                  border: `1px solid ${student.type === "online" ? "#BFDBFE" : "#BBF7D0"}`,
                  borderRadius: 10,
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 14 }}>
                  {student.type === "online" ? "🌐" : "📍"}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: student.type === "online" ? "#3B82F6" : "#16A34A",
                  }}
                >
                  {student.type === "online" ? "Online" : "Offline"}
                </span>
              </div>
              {student.type === "offline" && student.address && (
                <div
                  style={{
                    background: "#FFF8FA",
                    border: "1px solid #F4D8DE",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    overflow: "hidden",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#C4A0A8", flexShrink: 0 }}>
                    🏠
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#5C3040",
                      fontWeight: 500,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.address}
                  </span>
                </div>
              )}
            </div>

            {/* Notes */}
            {selected.notes && (
              <div
                style={{
                  marginTop: 10,
                  background: "#FFF8FA",
                  border: "1px solid #F4D8DE",
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                <div style={{ ...fieldLabel, marginBottom: 4 }}>Ghi chú</div>
                <div style={{ fontSize: 13, color: "#5C3040", lineHeight: 1.5 }}>
                  {selected.notes}
                </div>
              </div>
            )}

            {/* Link to bill */}
            <Link
              href={`/bills/${selected.bill.id}`}
              style={{
                display: "block",
                marginTop: 14,
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
        )}
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
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                color: showFixedSchedule ? "#C45870" : "#A87888",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Switch
                checked={showFixedSchedule}
                onCheckedChange={setShowFixedSchedule}
                aria-label="Hiển thị lịch dạy cố định"
              />
              <span className={isMobile ? "sr-only" : undefined}>Lịch cố định</span>
            </label>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {showFixedSchedule ? (
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "#C45870",
                  background: "#FFF0F3",
                  border: "1px solid #F4D8DE",
                  borderRadius: 9999,
                  padding: "6px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                Hàng tuần
              </span>
            ) : (
              <>
                <button onClick={() => setWeekStart((ws) => addDaysStr(ws, -7))} style={navBtnStyle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <button onClick={() => setWeekStart((ws) => addDaysStr(ws, 7))} style={navBtnStyle}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </>
            )}
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
              gap: "4px",
              padding: "8px 12px",
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
                    flex: 1,
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
                  {!showFixedSchedule && (
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: isSelected ? 700 : 500,
                      }}
                    >
                      {new Date(day + "T00:00:00").getDate()}
                    </span>
                  )}
                  {!showFixedSchedule && isToday && (
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
            {showFixedSchedule ? (
              fixedSessionsForSelectedDay.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "#A87888",
                    fontSize: "13px",
                    paddingTop: "32px",
                  }}
                >
                  Không có lịch dạy cố định
                </div>
              ) : (
                fixedSessionsForSelectedDay.map((session) => {
                  const color = getColor(session.student);
                  return (
                    <Link
                      key={session.id}
                      href={`/students/${session.student.id}`}
                      style={{
                        background: "white",
                        border: "1px solid #F4D8DE",
                        borderRadius: "12px",
                        padding: "14px 16px",
                        cursor: "pointer",
                        borderLeft: `4px solid ${color.hex}`,
                        textDecoration: "none",
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#2C1820" }}>
                        {session.student.name}
                      </div>
                      <div style={{ fontSize: "13px", color: "#A87888", marginTop: "3px", fontFamily: "monospace" }}>
                        {session.startTime} – {session.endTime}
                      </div>
                      <div style={{ fontSize: "11px", color: "#C45870", marginTop: 7, fontWeight: 600 }}>
                        Xem và sửa tại hồ sơ học sinh →
                      </div>
                    </Link>
                  );
                })
              )
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
                const sessionNote = session.notes?.trim() || session.bill.notes?.trim();
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
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#8F6D79",
                        marginTop: "7px",
                        fontWeight: 500,
                      }}
                    >
                      {session.bill.student.type === "online" ? "🌐 Online" : "📍 Offline"}
                    </div>
                    {sessionNote && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6B4858",
                          marginTop: "3px",
                          lineHeight: 1.4,
                        }}
                      >
                        {sessionNote}
                      </div>
                    )}
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
            {calendarColumns.map((column) => {
              const dateStr = column.date
                ? column.date.slice(8) + "-" + column.date.slice(5, 7)
                : null;
              return (
                <div
                  key={column.key}
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
                    {column.label}
                  </div>
                  {dateStr && (
                    <div
                      style={
                        column.isToday
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
                  )}
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
              {calendarColumns.map((column) => {
                return (
                  <div
                    key={column.key}
                    style={{
                      flex: 1,
                      position: "relative",
                      borderRight: "1px solid #F4D8DE",
                      height: `${dynamicGridH}px`,
                      background: column.isToday
                        ? "rgba(232,120,138,0.04)"
                        : "transparent",
                      transition: "background 300ms ease",
                    }}
                  >
                    {!loading &&
                      !showFixedSchedule &&
                      sessions
                        .filter((s) => s.scheduledDate === column.date)
                        .map((s) => {
                        const topPx =
                          ((pt(s.startTime) - GRID_S * 60) / 60) * HOUR_H;
                        const color = getColor(s.bill.student);
                        const sessionNote = s.notes?.trim() || s.bill.notes?.trim();
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
                            {sessionNote && (
                              <div
                                style={{
                                  fontSize: "9px",
                                  color: "rgba(44,24,32,0.55)",
                                  marginTop: "3px",
                                  lineHeight: 1.35,
                                  overflow: "hidden",
                                  display: "-webkit-box",
                                  WebkitBoxOrient: "vertical",
                                  WebkitLineClamp: 2,
                                }}
                              >
                                {sessionNote}
                              </div>
                            )}
                          </button>
                        );
                        })}
                    {!loading &&
                      showFixedSchedule &&
                      fixedSessions
                        .filter((s) => s.dayOfWeek === column.dayOfWeek)
                        .map((s) => {
                          const topPx =
                            ((pt(s.startTime) - GRID_S * 60) / 60) * HOUR_H;
                          const color = getColor(s.student);
                          return (
                            <Link
                              key={s.id}
                              href={`/students/${s.student.id}`}
                              style={{
                                position: "absolute",
                                top: `${topPx}px`,
                                left: "5px",
                                right: "5px",
                                background: color.bg,
                                borderRadius: "9px",
                                padding: "6px 9px 7px",
                                overflow: "hidden",
                                textAlign: "left",
                                textDecoration: "none",
                                boxShadow: `0 4px 14px ${color.shadow}, 0 1px 4px ${color.shadow}`,
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
                                {s.student.name}
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
                                {s.student.type === "online" ? "🌐 Online" : "📍 Offline"}
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
      )}

      {/* Session detail modal — bottom sheet on mobile, centered dialog on desktop */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
            setIsEditing(false);
          }
        }}
      >
        <DialogContent hideCloseButton>
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 16, color: "#2C1820" }}>
              {isEditing ? "Chỉnh sửa buổi học" : "Chi tiết buổi học"}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* A paid invoice is locked server-side; don't offer the edit affordance. */}
              {!isEditing && selected?.bill.status !== "paid" && (
                <button
                  onClick={handleEdit}
                  style={{
                    width: 32,
                    height: 32,
                    background: "#FFF8FA",
                    border: "1px solid #F4D8DE",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#A87888",
                  }}
                >
                  <Pencil size={14} />
                </button>
              )}
              <DialogClose
                style={{
                  width: 32,
                  height: 32,
                  background: "#FFF8FA",
                  border: "1px solid #F4D8DE",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#A87888",
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </DialogClose>
            </div>
          </div>
          {renderSessionDetail()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
