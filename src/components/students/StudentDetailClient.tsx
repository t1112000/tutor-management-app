"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker } from "@/components/ui/time-picker";
import { formatMoneyVND, formatDateVN } from "@/lib/time";
import { STUDENT_COLORS } from "@/lib/student-colors";

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
  parentName: string;
  parentPhone: string;
  color: string | null;
}

type AddPicker =
  | { phase: "start"; dayOfWeek: number; startTime: string }
  | { phase: "end"; dayOfWeek: number; startTime: string; endTime: string };

const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const DAY_VALUES = [1, 2, 3, 4, 5, 6, 0];

const cardStyle: React.CSSProperties = {
  background: "white", borderRadius: 16, border: "1px solid #F4D8DE",
  padding: 24, marginBottom: 20,
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 600, color: "#C4A0A8",
  textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6,
};

function studentToForm(s: Student): FormData {
  return {
    name: s.name,
    phone: s.phone ?? "",
    birthday: s.birthday ?? "",
    subject: s.subject,
    address: s.address ?? "",
    notes: s.notes ?? "",
    parentName: s.parentName ?? "",
    parentPhone: s.parentPhone ?? "",
    color: s.color,
  };
}

export default function StudentDetailClient({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [form, setForm] = useState<FormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addPicker, setAddPicker] = useState<AddPicker | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/students/${studentId}`);
    if (!res.ok) { router.push("/students"); return; }
    const data: Student = await res.json();
    setStudent(data);
    setForm(studentToForm(data));
    setIsDirty(false);
  }, [studentId, router]);

  useEffect(() => { load(); }, [load]);

  function updateForm(patch: Partial<FormData>) {
    setForm((f) => f ? { ...f, ...patch } : f);
    setIsDirty(true);
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
      if (!res.ok) { toast.error("Lưu thất bại"); return; }
      toast.success("Đã lưu thông tin");
      load();
    } finally { setSaving(false); }
  }

  async function pickColor(hex: string) {
    if (!form) return;
    const newForm = { ...form, color: hex };
    setForm(newForm);
    setIsDirty(false);
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (!res.ok) { toast.error("Không thể lưu màu"); return; }
    setStudent((s) => s ? { ...s, color: hex } : s);
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

  async function addSchedule(dayOfWeek: number, startTime: string, endTime: string) {
    const res = await fetch(`/api/students/${studentId}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, startTime, endTime }),
    });
    if (!res.ok) { toast.error("Thêm lịch thất bại"); return; }
    toast.success("Đã thêm lịch");
    setAddPicker(null);
    load();
  }

  if (!student || !form) {
    return <div style={{ padding: 32, color: "#A87888" }}>Đang tải...</div>;
  }

  return (
    <div style={{ padding: "24px 32px", maxWidth: 1100 }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/students"
            style={{ display: "flex", alignItems: "center", gap: 4, color: "#A87888", fontSize: 14, textDecoration: "none" }}
          >
            <ChevronLeft size={16} /> Học sinh
          </Link>
          <span style={{ color: "#E0C0C8" }}>/</span>
          <span style={{ fontWeight: 600, color: "#2C1820", fontSize: 14 }}>{student.name}</span>
        </div>
        <Link href={`/students/${studentId}/bills/new`}>
          <button style={{
            background: "linear-gradient(135deg,#E8788A,#F0A0B0)", color: "white",
            border: "none", borderRadius: 12, padding: "10px 20px",
            fontWeight: 600, fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Plus size={16} /> Tạo hóa đơn mới
          </button>
        </Link>
      </div>

      {/* ── Info card ── */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontWeight: 700, fontSize: 16, color: "#2C1820", margin: 0 }}>Thông tin học sinh</h2>
          <button
            onClick={deleteStudent}
            style={{ fontSize: 12, color: "#F07888", background: "none", border: "none", cursor: "pointer" }}
          >
            Xóa học sinh
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div>
            <span style={labelStyle}>Họ và tên</span>
            <Input value={form.name} onChange={(e) => updateForm({ name: e.target.value })}
              style={{ borderColor: "#F4D8DE", borderRadius: 10 }} />
          </div>
          <div>
            <span style={labelStyle}>Môn học</span>
            <Select value={form.subject} onValueChange={(v: "english" | "chinese") => updateForm({ subject: v })}>
              <SelectTrigger style={{ borderColor: "#F4D8DE", borderRadius: 10 }}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="english">Tiếng Anh</SelectItem>
                <SelectItem value="chinese">Tiếng Trung</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <span style={labelStyle}>Số điện thoại</span>
            <Input value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })}
              style={{ borderColor: "#F4D8DE", borderRadius: 10 }} />
          </div>
          <div>
            <span style={labelStyle}>Địa chỉ</span>
            <Input value={form.address} onChange={(e) => updateForm({ address: e.target.value })}
              style={{ borderColor: "#F4D8DE", borderRadius: 10 }} />
          </div>
          <div>
            <span style={labelStyle}>Ngày sinh</span>
            <Input type="date" value={form.birthday} onChange={(e) => updateForm({ birthday: e.target.value })}
              style={{ borderColor: "#F4D8DE", borderRadius: 10 }} />
          </div>
          <div>
            <span style={labelStyle}>Phụ huynh</span>
            <Input value={form.parentName} onChange={(e) => updateForm({ parentName: e.target.value })}
              style={{ borderColor: "#F4D8DE", borderRadius: 10 }} />
          </div>
          <div>
            <span style={labelStyle}>SĐT phụ huynh</span>
            <Input value={form.parentPhone} onChange={(e) => updateForm({ parentPhone: e.target.value })}
              style={{ borderColor: "#F4D8DE", borderRadius: 10 }} />
          </div>
          <div />
          <div style={{ gridColumn: "1 / -1" }}>
            <span style={labelStyle}>Ghi chú</span>
            <Textarea value={form.notes} onChange={(e) => updateForm({ notes: e.target.value })} rows={2}
              style={{ borderColor: "#F4D8DE", borderRadius: 10 }} />
          </div>
        </div>

        {/* Color picker */}
        <div style={{ marginTop: 24 }}>
          <span style={labelStyle}>Màu trên lịch</span>
          <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap" }}>
            {STUDENT_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => pickColor(c.hex)}
                style={{
                  width: 32, height: 32, borderRadius: "50%", background: c.hex,
                  border: form.color === c.hex ? "3px solid white" : "3px solid transparent",
                  boxShadow: form.color === c.hex ? `0 0 0 2.5px ${c.hex}` : "none",
                  cursor: "pointer", transition: "box-shadow 120ms ease",
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>

        {isDirty && (
          <div style={{ marginTop: 20 }}>
            <Button onClick={saveStudent} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu thông tin"}
            </Button>
          </div>
        )}
      </div>

      {/* ── Schedule card — stub, completed in Task 7 ── */}
      <ScheduleCard
        student={student}
        addPicker={addPicker}
        setAddPicker={setAddPicker}
        removeSchedule={removeSchedule}
        addSchedule={addSchedule}
      />

      {/* ── Bills table — stub, completed in Task 8 ── */}
      <BillsTable bills={student.bills} studentId={studentId} />

    </div>
  );
}

function ScheduleCard(_: any) { return null; }
function BillsTable(_: any) { return null; }
