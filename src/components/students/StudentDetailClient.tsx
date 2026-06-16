"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { Progress } from "@/components/ui/progress";
import { formatMoneyVND, vnDayName } from "@/lib/time";

const DAY_OPTIONS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

interface Student {
  id: number; name: string; phone: string | null; birthday: string | null;
  subject: "english" | "chinese"; address: string | null; notes: string | null;
  parentName: string | null; parentPhone: string | null;
  schedules: Array<{ id: number; dayOfWeek: number; startTime: string; endTime: string }>;
  bills: Array<{ id: number; sessionCount: number; totalAmount: number; status: string; sessions: Array<{ isAttended: boolean }> }>;
}

export default function StudentDetailClient({ studentId }: { studentId: number }) {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Student>>({});
  const [newSchedule, setNewSchedule] = useState({ dayOfWeek: "1", startTime: "08:00", endTime: "09:30" });
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/students/${studentId}`);
    if (!res.ok) { router.push("/students"); return; }
    const data = await res.json();
    setStudent(data);
    setForm(data);
  }

  useEffect(() => { load(); }, [studentId]);

  async function saveStudent() {
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { toast.error("Lưu thất bại"); return; }
      toast.success("Đã lưu thông tin");
      setEditing(false);
      load();
    } finally { setSaving(false); }
  }

  async function addSchedule() {
    const res = await fetch(`/api/students/${studentId}/schedules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dayOfWeek: Number(newSchedule.dayOfWeek),
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
      }),
    });
    if (!res.ok) { toast.error("Thêm lịch thất bại"); return; }
    toast.success("Đã thêm lịch học");
    load();
  }

  async function removeSchedule(scheduleId: number) {
    await fetch(`/api/students/${studentId}/schedules`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduleId }),
    });
    toast.success("Đã xóa lịch");
    load();
  }

  async function deleteStudent() {
    if (!confirm("Xóa học sinh này? Hành động không thể hoàn tác.")) return;
    await fetch(`/api/students/${studentId}`, { method: "DELETE" });
    toast.success("Đã xóa học sinh");
    router.push("/students");
  }

  if (!student) return <div className="p-8 text-gray-400">Đang tải...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/students" className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> Học sinh
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">{student.name}</span>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
              {student.name.split(" ").map((n) => n[0]).slice(-1).join("").toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
              <SubjectBadge subject={student.subject} />
            </div>
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Hủy</Button>
                <Button size="sm" onClick={saveStudent} disabled={saving}>{saving ? "Đang lưu..." : "Lưu"}</Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Chỉnh sửa</Button>
                <Button variant="outline" size="sm" onClick={deleteStudent} className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {editing ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Tên</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Môn học</Label>
              <Select value={form.subject ?? "english"} onValueChange={(v: any) => setForm({ ...form, subject: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">Tiếng Anh</SelectItem>
                  <SelectItem value="chinese">Tiếng Trung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>SĐT</Label>
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Ngày sinh</Label>
              <Input type="date" value={form.birthday ?? ""} onChange={(e) => setForm({ ...form, birthday: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Phụ huynh</Label>
              <Input value={form.parentName ?? ""} onChange={(e) => setForm({ ...form, parentName: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>SĐT phụ huynh</Label>
              <Input value={form.parentPhone ?? ""} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Địa chỉ</Label>
              <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label>Ghi chú</Label>
              <Textarea value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-400">SĐT:</span> <span className="ml-2">{student.phone ?? "—"}</span></div>
            <div><span className="text-gray-400">Ngày sinh:</span> <span className="ml-2">{student.birthday ?? "—"}</span></div>
            <div><span className="text-gray-400">Phụ huynh:</span> <span className="ml-2">{student.parentName ?? "—"}</span></div>
            <div><span className="text-gray-400">SĐT PH:</span> <span className="ml-2">{student.parentPhone ?? "—"}</span></div>
            <div className="col-span-2"><span className="text-gray-400">Địa chỉ:</span> <span className="ml-2">{student.address ?? "—"}</span></div>
            {student.notes && <div className="col-span-2"><span className="text-gray-400">Ghi chú:</span> <span className="ml-2">{student.notes}</span></div>}
          </div>
        )}
      </div>

      {/* Schedules */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Lịch học mặc định</h2>
        {student.schedules.length === 0 ? (
          <p className="text-sm text-gray-400 mb-4">Chưa có lịch học</p>
        ) : (
          <div className="space-y-2 mb-4">
            {student.schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((s) => (
              <div key={s.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2">
                <span className="text-sm font-medium">{DAY_OPTIONS.find((d) => d.value === s.dayOfWeek)?.label}</span>
                <span className="text-sm text-gray-600">{s.startTime} – {s.endTime}</span>
                <button onClick={() => removeSchedule(s.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="space-y-1">
            <Label className="text-xs">Thứ</Label>
            <Select value={newSchedule.dayOfWeek} onValueChange={(v) => setNewSchedule({ ...newSchedule, dayOfWeek: v })}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DAY_OPTIONS.map((d) => <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bắt đầu</Label>
            <Input type="time" value={newSchedule.startTime} onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })} className="w-28" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kết thúc</Label>
            <Input type="time" value={newSchedule.endTime} onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })} className="w-28" />
          </div>
          <Button onClick={addSchedule} variant="outline" size="sm" className="mb-0.5 gap-1">
            <Plus className="w-4 h-4" /> Thêm
          </Button>
        </div>
      </div>

      {/* Bills */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Lịch sử hóa đơn</h2>
          <Link href={`/students/${studentId}/bills/new`}>
            <Button size="sm" className="gap-1"><Plus className="w-4 h-4" /> Tạo hóa đơn</Button>
          </Link>
        </div>
        {!student.bills?.length ? (
          <p className="text-sm text-gray-400">Chưa có hóa đơn</p>
        ) : (
          <div className="space-y-3">
            {student.bills.map((b) => {
              const attended = b.sessions?.filter((s) => s.isAttended).length ?? 0;
              const pct = b.sessionCount > 0 ? Math.round((attended / b.sessionCount) * 100) : 0;
              return (
                <Link key={b.id} href={`/bills/${b.id}`}>
                  <div className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 hover:border-primary/30 transition-colors">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatMoneyVND(b.totalAmount)}
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${b.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                          {b.status === "paid" ? "Đã thu" : "Chưa thu"}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{attended}/{b.sessionCount} buổi đã học</div>
                    </div>
                    <div className="w-24">
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
