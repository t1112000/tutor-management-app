"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Pencil, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatMoneyVND, formatDateVN } from "@/lib/time";
import { STUDENT_COLORS } from "@/lib/student-colors";
import useIsMobile from "@/hooks/use-is-mobile";

interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BillSummary {
  id: number;
  startDate: string | null;
  sessionCount: number;
  totalAmount: number;
  status: "unpaid" | "paid";
  sessions: Array<{ isAttended: boolean }>;
}

interface Student {
  id: number;
  name: string;
  phone: string | null;
  birthday: string | null;
  subject: "english" | "chinese";
  address: string | null;
  notes: string | null;
  parentName: string | null;
  parentPhone: string | null;
  color: string | null;
  type: "offline" | "online";
  schedules: Schedule[];
  bills: BillSummary[];
}

interface FormData {
  name: string;
  phone: string;
  birthday: string;
  subject: "english" | "chinese";
  address: string;
  notes: string;
  color: string | null;
  type: "offline" | "online";
}

type AddPicker = { dayOfWeek: number; startTime: string; endTime: string };
type EditPicker = { id: number; dayOfWeek: number; startTime: string; endTime: string };

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

function addOneHour(time: string): string {
  const [h, m] = time.split(":").map(Number);
  return `${String((h + 1) % 24).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 11,
  fontWeight: 600,
  color: "#C4A0A8",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  background: "#FFF8FA",
  borderColor: "#ECC8D0",
  borderRadius: 10,
};

const DEFAULT_COLOR = "#6BA8F0";

function studentToForm(s: Student): FormData {
  return {
    name: s.name,
    phone: s.phone ?? "",
    birthday: s.birthday ?? "",
    subject: s.subject,
    address: s.address ?? "",
    notes: s.notes ?? "",
    color: s.color ?? DEFAULT_COLOR,
    type: s.type ?? "offline",
  };
}

const hdrStyle: React.CSSProperties = {
  height: 64,
  padding: "0 32px",
  display: "flex",
  alignItems: "center",
  borderBottom: "1px solid #F4D8DE",
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(12px)",
  position: "sticky",
  top: 0,
  zIndex: 10,
  flexShrink: 0,
  justifyContent: "space-between",
};

export default function StudentDetailClient({
  studentId,
}: {
  studentId: number;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [student, setStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addPicker, setAddPicker] = useState<AddPicker | null>(null);
  const [editPicker, setEditPicker] = useState<EditPicker | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/students/${studentId}`);
    if (!res.ok) {
      router.push("/students");
      return;
    }
    const data: Student = await res.json();
    setStudent(data);
    setForm(studentToForm(data));
    setIsEditing(false);
  }, [studentId, router]);

  useEffect(() => {
    load();
  }, [load]);

  function updateForm(patch: Partial<FormData>) {
    setForm((f) => (f ? { ...f, ...patch } : f));
  }

  function startEdit() {
    if (student) setForm(studentToForm(student));
    setIsEditing(true);
  }

  function cancelEdit() {
    if (student) setForm(studentToForm(student));
    setIsEditing(false);
  }

  async function saveStudent() {
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("Lưu thất bại");
        return;
      }
      toast.success("Đã lưu thông tin");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function pickColor(hex: string) {
    if (!form) return;
    const newForm = { ...form, color: hex };
    setForm(newForm);
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (!res.ok) {
      toast.error("Không thể lưu màu");
      return;
    }
    setStudent((s) => (s ? { ...s, color: hex } : s));
  }

  async function deleteStudent() {
    if (!confirm("Xóa học sinh này? Hành động không thể hoàn tác.")) return;
    await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    toast.success("Đã xóa học sinh");
    router.push("/students");
  }

  async function removeSchedule(scheduleId: number) {
    await fetch(`/api/students/${studentId}/schedules`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId }),
    });
    load();
  }

  async function addSchedule(
    dayOfWeek: number,
    startTime: string,
    endTime: string,
  ) {
    const res = await fetch(`/api/students/${studentId}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, startTime, endTime }),
    });
    if (!res.ok) {
      toast.error("Thêm lịch thất bại");
      return;
    }
    toast.success("Đã thêm lịch");
    setAddPicker(null);
    load();
  }

  async function editSchedule(scheduleId: number, startTime: string, endTime: string) {
    const res = await fetch(`/api/students/${studentId}/schedules`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId, startTime, endTime }),
    });
    if (!res.ok) {
      toast.error("Cập nhật lịch thất bại");
      return;
    }
    toast.success("Đã cập nhật lịch");
    setEditPicker(null);
    load();
  }

  if (!student || !form) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100%",
          overflow: "hidden",
        }}
      >
        <div style={hdrStyle} />
        <div style={{ padding: 32, color: "#A87888" }}>Đang tải...</div>
      </div>
    );
  }

  const currentColor = form.color ?? DEFAULT_COLOR;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {/* ── Sticky header ── */}
      {isMobile ? (
        // Mobile: two-row layout so long names don't fight with the button
        <div
          style={{
            ...hdrStyle,
            height: "auto",
            padding: "10px 16px",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <div
            style={{
              display: "flex",
              width: "100%",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link
              href="/students"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#FFF0F3",
                border: "1px solid #F4D8DE",
                borderRadius: 8,
                padding: "5px 12px",
                color: "#A87888",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              <ChevronLeft size={14} /> Học sinh
            </Link>
            <Link href={`/students/${studentId}/bills/new`}>
              <button
                style={{
                  background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "7px 14px",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Plus size={14} /> Tạo hóa đơn mới
              </button>
            </Link>
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#2C1820",
              paddingLeft: 2,
              lineHeight: 1.3,
            }}
          >
            {student.name}
          </div>
        </div>
      ) : (
        <div style={{ ...hdrStyle, padding: "0 32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Link
              href="/students"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                background: "#FFF0F3",
                border: "1px solid #F4D8DE",
                borderRadius: 8,
                padding: "5px 12px",
                color: "#A87888",
                fontSize: 13,
                textDecoration: "none",
                fontWeight: 500,
                whiteSpace: "nowrap",
              }}
            >
              <ChevronLeft size={14} /> Học sinh
            </Link>
            <span style={{ color: "#E0C0C8", fontSize: 16 }}>/</span>
            <span style={{ fontWeight: 700, color: "#2C1820", fontSize: 15 }}>
              {student.name}
            </span>
          </div>
          <Link href={`/students/${studentId}/bills/new`}>
            <button
              style={{
                background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                color: "white",
                border: "none",
                borderRadius: 10,
                padding: "7px 16px",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus size={14} /> Tạo hóa đơn mới
            </button>
          </Link>
        </div>
      )}

      {/* ── Scrollable content ── */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: isMobile ? "16px" : "24px 32px",
        }}
      >
        {/* ── Info card ── */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #F4D8DE",
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
              gap: 8,
            }}
          >
            <h2
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: "#2C1820",
                margin: 0,
                flexShrink: 0,
              }}
            >
              Thông tin học sinh
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              {!isEditing && (
                <button
                  onClick={startEdit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 13,
                    color: "#A87888",
                    background: "#FFF0F3",
                    border: "1px solid #F4D8DE",
                    borderRadius: 8,
                    padding: "5px 10px",
                    cursor: "pointer",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  <Pencil size={13} /> Chỉnh sửa
                </button>
              )}
              <button
                onClick={deleteStudent}
                style={{
                  fontSize: 12,
                  color: "#F07888",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Xóa học sinh
              </button>
            </div>
          </div>

          {isEditing ? (
            /* ── Edit mode ── */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: "16px 24px",
              }}
            >
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={labelStyle}>Họ và tên</span>
                <Input
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                  placeholder="Nhập họ và tên"
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Môn học</span>
                <Select
                  value={form.subject}
                  onValueChange={(v: "english" | "chinese") =>
                    updateForm({ subject: v })
                  }
                >
                  <SelectTrigger style={inputStyle}>
                    <SelectValue placeholder="Chọn môn học" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">Tiếng Anh</SelectItem>
                    <SelectItem value="chinese">Tiếng Trung</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <span style={labelStyle}>Số điện thoại</span>
                <Input
                  value={form.phone}
                  onChange={(e) => updateForm({ phone: e.target.value })}
                  placeholder="0901 234 567"
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Địa chỉ</span>
                <Input
                  value={form.address}
                  onChange={(e) => updateForm({ address: e.target.value })}
                  placeholder="Nhập địa chỉ"
                  style={inputStyle}
                />
              </div>
              <div>
                <span style={labelStyle}>Ngày sinh</span>
                <DatePicker
                  value={form.birthday}
                  onChange={(v) => updateForm({ birthday: v })}
                  placeholder="Chọn ngày sinh"
                />
              </div>
              <div>
                <span style={labelStyle}>Hình thức học</span>
                <div
                  style={{
                    display: "flex",
                    background: "#F8F0F4",
                    borderRadius: 10,
                    padding: 3,
                    gap: 2,
                    width: "fit-content",
                    marginTop: 2,
                  }}
                >
                  {(["offline", "online"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => updateForm({ type: t })}
                      style={{
                        padding: "6px 20px",
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 600,
                        border: "none",
                        cursor: "pointer",
                        transition: "all 120ms ease",
                        background: form.type === t ? "white" : "transparent",
                        color: form.type === t ? "#2C1820" : "#A87888",
                        boxShadow:
                          form.type === t
                            ? "0 1px 4px rgba(0,0,0,0.08)"
                            : "none",
                      }}
                    >
                      {t === "offline" ? "Offline" : "Online"}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <span style={labelStyle}>Ghi chú</span>
                <Textarea
                  value={form.notes}
                  onChange={(e) => updateForm({ notes: e.target.value })}
                  rows={2}
                  placeholder="Ghi chú thêm..."
                  style={inputStyle}
                />
              </div>
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: 10,
                  marginTop: 4,
                }}
              >
                <button
                  onClick={saveStudent}
                  disabled={saving}
                  style={{
                    background: "linear-gradient(135deg,#E8788A,#F0A0B0)",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 18px",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? "Đang lưu..." : "Lưu thông tin"}
                </button>
                <button
                  onClick={cancelEdit}
                  style={{
                    background: "white",
                    color: "#A87888",
                    border: "1px solid #F4D8DE",
                    borderRadius: 8,
                    padding: "7px 16px",
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            /* ── View mode ── */
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: isMobile ? "16px" : "20px 40px",
              }}
            >
              <div>
                <span style={labelStyle}>Họ và tên</span>
                <div
                  style={{ fontSize: 15, fontWeight: 600, color: "#2C1820" }}
                >
                  {student.name || "—"}
                </div>
              </div>
              <div>
                <span style={labelStyle}>Môn học</span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 13,
                      fontWeight: 500,
                      background: "#EBF5FF",
                      color: "#3B82F6",
                      padding: "3px 12px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.subject === "english"
                      ? "Tiếng Anh"
                      : "Tiếng Trung"}
                  </span>
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: 13,
                      fontWeight: 500,
                      background:
                        student.type === "online" ? "#E8F5E9" : "#FFF3E0",
                      color: student.type === "online" ? "#2E7D32" : "#E65100",
                      padding: "3px 12px",
                      borderRadius: 20,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {student.type === "online" ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              <div>
                <span style={labelStyle}>Số điện thoại</span>
                <div style={{ fontSize: 15, color: "#2C1820" }}>
                  {student.phone || "—"}
                </div>
              </div>
              <div>
                <span style={labelStyle}>Địa chỉ</span>
                <div style={{ fontSize: 15, color: "#2C1820" }}>
                  {student.address || "—"}
                </div>
              </div>
              {student.birthday && (
                <div>
                  <span style={labelStyle}>Ngày sinh</span>
                  <div style={{ fontSize: 15, color: "#2C1820" }}>
                    {formatDateVN(student.birthday)}
                  </div>
                </div>
              )}
              {student.notes && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <span style={labelStyle}>Ghi chú</span>
                  <div
                    style={{
                      fontSize: 14,
                      color: "#6B7280",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {student.notes}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Color picker — always visible */}
          <div
            style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: "1px solid #F9F0F2",
            }}
          >
            <span style={labelStyle}>Màu trên lịch</span>
            <div
              style={{
                display: "flex",
                gap: 10,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {STUDENT_COLORS.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => pickColor(c.hex)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: c.hex,
                    border:
                      currentColor === c.hex
                        ? "3px solid white"
                        : "3px solid transparent",
                    boxShadow:
                      currentColor === c.hex ? `0 0 0 2.5px ${c.hex}` : "none",
                    cursor: "pointer",
                    transition: "box-shadow 120ms ease",
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Schedule card ── */}
        <ScheduleCard
          student={student}
          addPicker={addPicker}
          setAddPicker={setAddPicker}
          editPicker={editPicker}
          setEditPicker={setEditPicker}
          removeSchedule={removeSchedule}
          addSchedule={addSchedule}
          editSchedule={editSchedule}
          isMobile={isMobile}
        />

        {/* ── Bills table ── */}
        <BillsTable
          bills={student.bills}
          studentId={studentId}
          isMobile={isMobile}
        />
      </div>
    </div>
  );
}

// ── Inline time spinner col with click-to-type ──────────────────────────────
const SCHED_MINS = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

function parseHM(t: string): [number, number] {
  const [h, m] = t.split(":").map(Number);
  return [h ?? 7, m ?? 0];
}

function toTimeStr(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function TimeSpinnerCol({
  time,
  onChange,
  label,
}: {
  time: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [h, m] = parseHM(time);
  const mIdx = Math.max(
    0,
    SCHED_MINS.findIndex((x) => x === m),
  );
  const [editH, setEditH] = useState(false);
  const [editM, setEditM] = useState(false);
  const [hVal, setHVal] = useState("");
  const [mVal, setMVal] = useState("");

  const btn: React.CSSProperties = {
    width: 44,
    height: 30,
    background: "#F8F0F4",
    border: "1px solid #F4D8DE",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 11,
    color: "#A87888",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const box: React.CSSProperties = {
    width: 56,
    height: 52,
    background: "#F8F0F4",
    border: "1px solid #F4D8DE",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 26,
    fontWeight: 700,
    color: "#2C1820",
    cursor: "text",
  };
  const editBox: React.CSSProperties = {
    ...box,
    border: "2px solid #E8788A",
    outline: "none",
    textAlign: "center",
    background: "#FFF8FA",
  };

  function commitH(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n)) onChange(toTimeStr(Math.max(0, Math.min(23, n)), m));
    setEditH(false);
  }
  function commitM(val: string) {
    const n = parseInt(val, 10);
    if (!isNaN(n)) {
      const nearest = SCHED_MINS.reduce((p, c) =>
        Math.abs(c - n) < Math.abs(p - n) ? c : p,
      );
      onChange(toTimeStr(h, nearest));
    }
    setEditM(false);
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#A87888",
          marginBottom: 4,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 4 }}>
        {/* Hours */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <button
            style={btn}
            onClick={() => onChange(toTimeStr((h + 1) % 24, m))}
          >
            ▲
          </button>
          {editH ? (
            <input
              autoFocus
              style={editBox as React.CSSProperties}
              value={hVal}
              onChange={(e) => setHVal(e.target.value)}
              onBlur={() => commitH(hVal)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitH(hVal);
                if (e.key === "Escape") setEditH(false);
              }}
            />
          ) : (
            <div
              style={box}
              onClick={() => {
                setHVal(String(h).padStart(2, "0"));
                setEditH(true);
              }}
            >
              {String(h).padStart(2, "0")}
            </div>
          )}
          <button
            style={btn}
            onClick={() => onChange(toTimeStr((h - 1 + 24) % 24, m))}
          >
            ▼
          </button>
          <span style={{ fontSize: 10, color: "#A87888", marginTop: 2 }}>
            giờ
          </span>
        </div>
        <span
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#2C1820",
            paddingTop: 34,
            lineHeight: 1,
          }}
        >
          :
        </span>
        {/* Minutes */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <button
            style={btn}
            onClick={() =>
              onChange(toTimeStr(h, SCHED_MINS[(mIdx + 1) % SCHED_MINS.length]))
            }
          >
            ▲
          </button>
          {editM ? (
            <input
              autoFocus
              style={editBox as React.CSSProperties}
              value={mVal}
              onChange={(e) => setMVal(e.target.value)}
              onBlur={() => commitM(mVal)}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitM(mVal);
                if (e.key === "Escape") setEditM(false);
              }}
            />
          ) : (
            <div
              style={box}
              onClick={() => {
                setMVal(String(SCHED_MINS[mIdx]).padStart(2, "0"));
                setEditM(true);
              }}
            >
              {String(SCHED_MINS[mIdx]).padStart(2, "0")}
            </div>
          )}
          <button
            style={btn}
            onClick={() =>
              onChange(
                toTimeStr(
                  h,
                  SCHED_MINS[
                    (mIdx - 1 + SCHED_MINS.length) % SCHED_MINS.length
                  ],
                ),
              )
            }
          >
            ▼
          </button>
          <span style={{ fontSize: 10, color: "#A87888", marginTop: 2 }}>
            phút
          </span>
        </div>
      </div>
    </div>
  );
}

// ── ScheduleCard ─────────────────────────────────────────────────────────────
interface ScheduleCardProps {
  student: Student;
  addPicker: AddPicker | null;
  setAddPicker: React.Dispatch<React.SetStateAction<AddPicker | null>>;
  editPicker: EditPicker | null;
  setEditPicker: React.Dispatch<React.SetStateAction<EditPicker | null>>;
  removeSchedule: (id: number) => void;
  addSchedule: (dow: number, start: string, end: string) => void;
  editSchedule: (id: number, start: string, end: string) => void;
  isMobile: boolean;
}

function ScheduleCard({
  student,
  addPicker,
  setAddPicker,
  editPicker,
  setEditPicker,
  removeSchedule,
  addSchedule,
  editSchedule,
  isMobile,
}: ScheduleCardProps) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid #F4D8DE",
        padding: 24,
        marginBottom: 20,
      }}
    >
      <h2
        style={{
          fontWeight: 700,
          fontSize: 16,
          color: "#2C1820",
          margin: "0 0 20px",
        }}
      >
        Lịch dạy cố định hàng tuần
      </h2>

      {isMobile ? (
        /* ── Mobile: vertical list of days with schedules ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DAY_NAMES.map((dayName, idx) => {
            const dow = DAY_VALUES[idx];
            const daySchedules = student.schedules.filter(
              (s) => s.dayOfWeek === dow,
            );
            const isOpen = addPicker?.dayOfWeek === dow;

            return (
              <div
                key={dow}
                style={{
                  background: "#FFF8FA",
                  borderRadius: 10,
                  padding: "10px 14px",
                  border: "1px solid #F4D8DE",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: daySchedules.length > 0 ? 8 : 0,
                  }}
                >
                  <div
                    style={{ fontWeight: 600, fontSize: 13, color: "#2C1820" }}
                  >
                    {dayName}
                  </div>
                  <Popover
                    open={isOpen}
                    onOpenChange={(o) => {
                      if (!o) setAddPicker(null);
                    }}
                  >
                    <PopoverTrigger asChild>
                      <button
                        onClick={() =>
                          setAddPicker({
                            dayOfWeek: dow,
                            startTime: "07:00",
                            endTime: "08:00",
                          })
                        }
                        style={{
                          background: "none",
                          border: "1px dashed #F4D8DE",
                          borderRadius: 6,
                          width: 26,
                          height: 26,
                          cursor: "pointer",
                          color: "#C4A0A8",
                          fontSize: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        +
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      style={{
                        width: 320,
                        padding: 20,
                        borderRadius: 20,
                        border: "1px solid #F4D8DE",
                        boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                        background: "white",
                      }}
                    >
                      <p
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "#2C1820",
                          margin: "0 0 16px",
                        }}
                      >
                        Thêm lịch — {dayName}
                      </p>
                      {isOpen && addPicker && (
                        <>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              justifyContent: "center",
                              alignItems: "center",
                              marginBottom: 16,
                            }}
                          >
                            <TimeSpinnerCol
                              label="Bắt đầu"
                              time={addPicker.startTime}
                              onChange={(v) =>
                                setAddPicker((p) =>
                                  p
                                    ? {
                                        ...p,
                                        startTime: v,
                                        endTime: addOneHour(v),
                                      }
                                    : p,
                                )
                              }
                            />
                            <span
                              style={{
                                fontSize: 20,
                                color: "#D4A0B0",
                                marginTop: 16,
                              }}
                            >
                              →
                            </span>
                            <TimeSpinnerCol
                              label="Kết thúc"
                              time={addPicker.endTime}
                              onChange={(v) =>
                                setAddPicker((p) =>
                                  p ? { ...p, endTime: v } : p,
                                )
                              }
                            />
                          </div>
                          <button
                            onClick={() => {
                              addSchedule(
                                addPicker.dayOfWeek,
                                addPicker.startTime,
                                addPicker.endTime,
                              );
                            }}
                            style={{
                              width: "100%",
                              height: 36,
                              border: "none",
                              borderRadius: 10,
                              cursor: "pointer",
                              background:
                                "linear-gradient(135deg,#E8788A,#F0A0B0)",
                              color: "white",
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            Xác nhận
                          </button>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
                {daySchedules.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      marginBottom: 6,
                    }}
                  >
                    {/* Time chip */}
                    <div
                      style={{
                        background: "#FFF0F2",
                        border: "1px solid #F4D8DE",
                        borderRadius: 20,
                        padding: "5px 14px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#E8788A",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {s.startTime} – {s.endTime}
                    </div>
                    {/* Action icons */}
                    <div style={{ display: "flex", gap: 6, marginLeft: "auto", alignItems: "center" }}>
                    {/* Edit button */}
                    <Popover
                      open={editPicker?.id === s.id}
                      onOpenChange={(o) => {
                        if (!o) setEditPicker(null);
                      }}
                    >
                      <PopoverTrigger asChild>
                        <button
                          onClick={() =>
                            setEditPicker({
                              id: s.id,
                              dayOfWeek: s.dayOfWeek,
                              startTime: s.startTime,
                              endTime: s.endTime,
                            })
                          }
                          style={{
                            background: "#DBEAFE",
                            border: "none",
                            borderRadius: "50%",
                            width: 28,
                            height: 28,
                            padding: 0,
                            flexShrink: 0,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Pencil size={13} color="#3B82F6" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent
                        style={{
                          width: 320,
                          padding: 20,
                          borderRadius: 20,
                          border: "1px solid #F4D8DE",
                          boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                          background: "white",
                        }}
                      >
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: 14,
                            color: "#2C1820",
                            margin: "0 0 16px",
                          }}
                        >
                          Sửa lịch — {dayName}
                        </p>
                        {editPicker?.id === s.id && (
                          <>
                            <div
                              style={{
                                display: "flex",
                                gap: 12,
                                justifyContent: "center",
                                alignItems: "center",
                                marginBottom: 16,
                              }}
                            >
                              <TimeSpinnerCol
                                label="Bắt đầu"
                                time={editPicker.startTime}
                                onChange={(v) =>
                                  setEditPicker((p) =>
                                    p ? { ...p, startTime: v } : p,
                                  )
                                }
                              />
                              <span
                                style={{
                                  fontSize: 20,
                                  color: "#D4A0B0",
                                  marginTop: 16,
                                }}
                              >
                                →
                              </span>
                              <TimeSpinnerCol
                                label="Kết thúc"
                                time={editPicker.endTime}
                                onChange={(v) =>
                                  setEditPicker((p) =>
                                    p ? { ...p, endTime: v } : p,
                                  )
                                }
                              />
                            </div>
                            <button
                              onClick={() =>
                                editSchedule(
                                  s.id,
                                  editPicker.startTime,
                                  editPicker.endTime,
                                )
                              }
                              style={{
                                width: "100%",
                                height: 36,
                                border: "none",
                                borderRadius: 10,
                                cursor: "pointer",
                                background:
                                  "linear-gradient(135deg,#E8788A,#F0A0B0)",
                                color: "white",
                                fontWeight: 600,
                                fontSize: 13,
                              }}
                            >
                              Lưu
                            </button>
                          </>
                        )}
                      </PopoverContent>
                    </Popover>
                    {/* Delete button */}
                    <button
                      onClick={() => removeSchedule(s.id)}
                      style={{
                        background: "#FECACA",
                        border: "none",
                        borderRadius: "50%",
                        width: 28,
                        height: 28,
                        padding: 0,
                        flexShrink: 0,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={13} color="#EF4444" />
                    </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Desktop: 7-column grid ── */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
          }}
        >
          {DAY_NAMES.map((dayName, idx) => {
            const dow = DAY_VALUES[idx];
            const daySchedules = student.schedules.filter(
              (s) => s.dayOfWeek === dow,
            );
            const isOpen = addPicker?.dayOfWeek === dow;

            return (
              <div
                key={dow}
                style={{
                  border: "1px dashed #F4D8DE",
                  borderRadius: 12,
                  padding: 10,
                  minHeight: 140,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#A87888",
                    marginBottom: 4,
                  }}
                >
                  {dayName}
                </div>

                {daySchedules.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      background: "#EBF3FD",
                      border: "1px solid #BEDAF5",
                      borderRadius: 8,
                      padding: "6px 8px",
                    }}
                  >
                    <div style={{ fontSize: 10, color: "#6B7280" }}>
                      Bắt đầu
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: "#3B82F6",
                      }}
                    >
                      {s.startTime}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#6B7280", marginTop: 4 }}
                    >
                      Kết thúc
                    </div>
                    <div style={{ fontSize: 13, color: "#4B5563" }}>
                      {s.endTime}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 4,
                        marginTop: 6,
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* Edit button */}
                      <Popover
                        open={editPicker?.id === s.id}
                        onOpenChange={(o) => {
                          if (!o) setEditPicker(null);
                        }}
                      >
                        <PopoverTrigger asChild>
                          <button
                            onClick={() =>
                              setEditPicker({
                                id: s.id,
                                dayOfWeek: s.dayOfWeek,
                                startTime: s.startTime,
                                endTime: s.endTime,
                              })
                            }
                            style={{
                              background: "#DBEAFE",
                              border: "none",
                              borderRadius: "50%",
                              width: 20,
                              height: 20,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                            }}
                          >
                            <Pencil size={10} color="#3B82F6" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          style={{
                            width: 320,
                            padding: 20,
                            borderRadius: 20,
                            border: "1px solid #F4D8DE",
                            boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                            background: "white",
                          }}
                        >
                          <p
                            style={{
                              fontWeight: 700,
                              fontSize: 14,
                              color: "#2C1820",
                              margin: "0 0 16px",
                            }}
                          >
                            Sửa lịch — {dayName}
                          </p>
                          {editPicker?.id === s.id && (
                            <>
                              <div
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  justifyContent: "center",
                                  alignItems: "center",
                                  marginBottom: 16,
                                }}
                              >
                                <TimeSpinnerCol
                                  label="Bắt đầu"
                                  time={editPicker.startTime}
                                  onChange={(v) =>
                                    setEditPicker((p) =>
                                      p ? { ...p, startTime: v } : p,
                                    )
                                  }
                                />
                                <span
                                  style={{
                                    fontSize: 20,
                                    color: "#D4A0B0",
                                    marginTop: 16,
                                  }}
                                >
                                  →
                                </span>
                                <TimeSpinnerCol
                                  label="Kết thúc"
                                  time={editPicker.endTime}
                                  onChange={(v) =>
                                    setEditPicker((p) =>
                                      p ? { ...p, endTime: v } : p,
                                    )
                                  }
                                />
                              </div>
                              <button
                                onClick={() =>
                                  editSchedule(
                                    s.id,
                                    editPicker.startTime,
                                    editPicker.endTime,
                                  )
                                }
                                style={{
                                  width: "100%",
                                  height: 36,
                                  border: "none",
                                  borderRadius: 10,
                                  cursor: "pointer",
                                  background:
                                    "linear-gradient(135deg,#E8788A,#F0A0B0)",
                                  color: "white",
                                  fontWeight: 600,
                                  fontSize: 13,
                                }}
                              >
                                Lưu
                              </button>
                            </>
                          )}
                        </PopoverContent>
                      </Popover>
                      {/* Delete button */}
                      <button
                        onClick={() => removeSchedule(s.id)}
                        style={{
                          background: "#FECACA",
                          border: "none",
                          borderRadius: "50%",
                          width: 20,
                          height: 20,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                      >
                        <X size={10} color="#EF4444" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Combined start+end picker */}
                <Popover
                  open={isOpen}
                  onOpenChange={(o) => {
                    if (!o) setAddPicker(null);
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      onClick={() =>
                        setAddPicker({
                          dayOfWeek: dow,
                          startTime: "07:00",
                          endTime: "08:00",
                        })
                      }
                      style={{
                        marginTop: "auto",
                        width: "100%",
                        height: 32,
                        background: "none",
                        border: "1px dashed #F4D8DE",
                        borderRadius: 8,
                        cursor: "pointer",
                        color: "#C4A0A8",
                        fontSize: 18,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    style={{
                      width: 320,
                      padding: 20,
                      borderRadius: 20,
                      border: "1px solid #F4D8DE",
                      boxShadow: "0 8px 32px rgba(232,120,138,0.15)",
                      background: "white",
                    }}
                  >
                    <p
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: "#2C1820",
                        margin: "0 0 16px",
                      }}
                    >
                      Thêm lịch — {dayName}
                    </p>
                    {isOpen && addPicker && (
                      <>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            justifyContent: "center",
                            alignItems: "center",
                            marginBottom: 16,
                          }}
                        >
                          <TimeSpinnerCol
                            label="Bắt đầu"
                            time={addPicker.startTime}
                            onChange={(v) =>
                              setAddPicker((p) =>
                                p
                                  ? {
                                      ...p,
                                      startTime: v,
                                      endTime: addOneHour(v),
                                    }
                                  : p,
                              )
                            }
                          />
                          <span
                            style={{
                              fontSize: 20,
                              color: "#D4A0B0",
                              marginTop: 16,
                            }}
                          >
                            →
                          </span>
                          <TimeSpinnerCol
                            label="Kết thúc"
                            time={addPicker.endTime}
                            onChange={(v) =>
                              setAddPicker((p) =>
                                p ? { ...p, endTime: v } : p,
                              )
                            }
                          />
                        </div>
                        <button
                          onClick={() => {
                            addSchedule(
                              addPicker.dayOfWeek,
                              addPicker.startTime,
                              addPicker.endTime,
                            );
                          }}
                          style={{
                            width: "100%",
                            height: 36,
                            border: "none",
                            borderRadius: 10,
                            cursor: "pointer",
                            background:
                              "linear-gradient(135deg,#E8788A,#F0A0B0)",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 13,
                          }}
                        >
                          Xác nhận
                        </button>
                      </>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface BillsTableProps {
  bills: BillSummary[];
  studentId: number;
  isMobile: boolean;
}

function BillsTable({ bills, isMobile }: BillsTableProps) {
  const router = useRouter();
  return (
    <div
      style={{
        background: "white",
        borderRadius: 16,
        border: "1px solid #F4D8DE",
        padding: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2
          style={{ fontWeight: 700, fontSize: 16, color: "#2C1820", margin: 0 }}
        >
          Lịch sử hóa đơn
        </h2>
        <span style={{ fontSize: 13, color: "#A87888" }}>
          {bills.length} hóa đơn
        </span>
      </div>

      {bills.length === 0 ? (
        <p style={{ color: "#C4A0A8", fontSize: 14 }}>Chưa có hóa đơn</p>
      ) : isMobile ? (
        /* ── Mobile: card list ── */
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {bills.map((b) => {
            const attended =
              b.sessions?.filter((s) => s.isAttended).length ?? 0;
            const pct =
              b.sessionCount > 0
                ? Math.round((attended / b.sessionCount) * 100)
                : 0;
            const isPaid = b.status === "paid";
            return (
              <div
                key={b.id}
                onClick={() => router.push(`/bills/${b.id}`)}
                style={{
                  background: "white",
                  border: "1px solid #F4D8DE",
                  borderRadius: 12,
                  padding: "14px 16px",
                  cursor: "pointer",
                }}
              >
                {/* Top row: status badge + date */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 20,
                      background: isPaid ? "#DCFCE7" : "#FEF9C3",
                      color: isPaid ? "#16A34A" : "#A16207",
                    }}
                  >
                    {isPaid ? "Đã thu" : "Chưa thanh toán"}
                  </span>
                  <span style={{ fontSize: 13, color: "#6B7280" }}>
                    {b.startDate ? formatDateVN(b.startDate) : "—"}
                  </span>
                </div>
                {/* Bottom row: progress + amount */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 6,
                        background: "#F4D8DE",
                        borderRadius: 99,
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "#6BA8F0",
                          borderRadius: 99,
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "#6B7280" }}>
                      {attended}/{b.sessionCount} buổi
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: "#2C1820" }}
                  >
                    {formatMoneyVND(b.totalAmount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Desktop: table ── */
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["NGÀY BẮT ĐẦU", "TIẾN ĐỘ", "SỐ TIỀN", "TRẠNG THÁI", "XEM"].map(
                (col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#C4A0A8",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      paddingBottom: 12,
                      borderBottom: "1px solid #F4D8DE",
                    }}
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => {
              const attended =
                b.sessions?.filter((s) => s.isAttended).length ?? 0;
              const pct =
                b.sessionCount > 0
                  ? Math.round((attended / b.sessionCount) * 100)
                  : 0;
              const isPaid = b.status === "paid";
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid #F9F0F2" }}>
                  <td
                    style={{
                      padding: "14px 0",
                      fontSize: 14,
                      color: "#2C1820",
                    }}
                  >
                    {b.startDate ? formatDateVN(b.startDate) : "—"}
                  </td>
                  <td style={{ padding: "14px 16px 14px 0" }}>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 80,
                          height: 6,
                          background: "#F4D8DE",
                          borderRadius: 99,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "#6BA8F0",
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          color: "#6B7280",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {attended}/{b.sessionCount} buổi
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "14px 16px 14px 0",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#2C1820",
                    }}
                  >
                    {formatMoneyVND(b.totalAmount)}
                  </td>
                  <td style={{ padding: "14px 16px 14px 0" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        padding: "4px 10px",
                        borderRadius: 20,
                        background: isPaid ? "#DCFCE7" : "#FEF9C3",
                        color: isPaid ? "#16A34A" : "#A16207",
                      }}
                    >
                      {isPaid ? "Đã thu" : "Chưa thanh toán"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 0" }}>
                    <Link
                      href={`/bills/${b.id}`}
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#E8788A",
                        textDecoration: "none",
                      }}
                    >
                      Xem →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
