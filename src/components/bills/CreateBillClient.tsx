"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { generateSessions } from "@/lib/generateSessions";
import { todayVN } from "@/lib/time";

interface Schedule {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Student {
  id: number;
  name: string;
  subject: "english" | "chinese";
  schedules: Schedule[];
}

interface SessionRow {
  scheduledDate: string;
  startTime: string;
  endTime: string;
}

export default function CreateBillClient({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [sessionCount, setSessionCount] = useState("8");
  const [totalAmount, setTotalAmount] = useState("");
  const [startDate, setStartDate] = useState(todayVN());
  const [notes, setNotes] = useState("");
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then(setStudent);
  }, [studentId]);

  useEffect(() => {
    if (!student) return;
    const count = parseInt(sessionCount) || 0;
    if (count > 0 && student.schedules.length > 0) {
      setSessions(generateSessions(startDate, count, student.schedules));
    } else {
      setSessions([]);
    }
  }, [student, sessionCount, startDate]);

  function updateSession(i: number, field: keyof SessionRow, value: string) {
    setSessions((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s));
  }

  function removeSession(i: number) {
    setSessions((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addSession() {
    setSessions((prev) => [...prev, { scheduledDate: startDate, startTime: "08:00", endTime: "09:30" }]);
  }

  async function submit() {
    if (!student) return;
    if (!totalAmount || Number(totalAmount) <= 0) { toast.error("Nhập số tiền hóa đơn"); return; }
    if (sessions.length === 0) { toast.error("Cần ít nhất 1 buổi học"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          sessionCount: sessions.length,
          totalAmount: Number(totalAmount),
          startDate,
          notes: notes || undefined,
          sessions,
        }),
      });
      if (!res.ok) { toast.error("Tạo hóa đơn thất bại"); return; }
      const { id } = await res.json();
      toast.success("Đã tạo hóa đơn");
      router.push(`/bills/${id}`);
    } finally {
      setSaving(false);
    }
  }

  if (!student) return <div className="p-8 text-gray-400">Đang tải...</div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/students/${studentId}`} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> {student.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">Tạo hóa đơn mới</span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: bill settings */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {student.name.split(" ").map((n) => n[0]).slice(-1).join("").toUpperCase()}
              </div>
              <div>
                <div className="font-semibold text-gray-900">{student.name}</div>
                <SubjectBadge subject={student.subject} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Số buổi học</Label>
                <Input type="number" min="1" value={sessionCount} onChange={(e) => setSessionCount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Học phí (đ)</Label>
                <Input type="number" min="0" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="1.500.000" />
              </div>
              <div className="space-y-1">
                <Label>Ngày bắt đầu</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Ghi chú</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Ghi chú..." />
              </div>
            </div>
          </div>

          <Button className="w-full" onClick={submit} disabled={saving}>
            {saving ? "Đang tạo..." : "Tạo hóa đơn"}
          </Button>
        </div>

        {/* Right: sessions table */}
        <div className="col-span-2">
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Danh sách buổi học ({sessions.length})</h2>
              <Button variant="outline" size="sm" onClick={addSession} className="gap-1">
                <Plus className="w-4 h-4" /> Thêm buổi
              </Button>
            </div>

            {sessions.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">
                {student.schedules.length === 0
                  ? "Học sinh chưa có lịch học. Nhập buổi thủ công."
                  : "Nhập số buổi và ngày bắt đầu để tạo tự động"}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sessions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-gray-400 w-4">{i + 1}.</span>
                    <Input
                      type="date"
                      value={s.scheduledDate}
                      onChange={(e) => updateSession(i, "scheduledDate", e.target.value)}
                      className="h-8 text-xs w-36"
                    />
                    <Input
                      type="time"
                      value={s.startTime}
                      onChange={(e) => updateSession(i, "startTime", e.target.value)}
                      className="h-8 text-xs w-24"
                    />
                    <span className="text-gray-400 text-xs">–</span>
                    <Input
                      type="time"
                      value={s.endTime}
                      onChange={(e) => updateSession(i, "endTime", e.target.value)}
                      className="h-8 text-xs w-24"
                    />
                    <button onClick={() => removeSession(i)} className="text-gray-300 hover:text-red-400 ml-auto">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
