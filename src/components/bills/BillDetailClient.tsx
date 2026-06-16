"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { SubjectBadge } from "@/components/ui/subject-badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatMoneyVND, formatDateVN } from "@/lib/time";

interface BillSession {
  id: number;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  isAttended: boolean;
  notes: string | null;
}

interface Bill {
  id: number;
  sessionCount: number;
  totalAmount: number;
  status: "unpaid" | "paid";
  paidAt: string | null;
  notes: string | null;
  student: { id: number; name: string; subject: "english" | "chinese" };
  sessions: BillSession[];
}

export default function BillDetailClient({ billId }: { billId: number }) {
  const [bill, setBill] = useState<Bill | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  async function load() {
    const res = await fetch(`/api/bills/${billId}`);
    if (res.ok) setBill(await res.json());
  }

  useEffect(() => { load(); }, [billId]);

  async function toggleAttended(sessionId: number, current: boolean) {
    await fetch(`/api/bills/${billId}/sessions/${sessionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAttended: !current }),
    });
    load();
  }

  async function markPaid() {
    setPayLoading(true);
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, { method: "POST" });
      if (!res.ok) { toast.error("Thao tác thất bại"); return; }
      toast.success("Đã đánh dấu thanh toán");
      load();
    } finally {
      setPayLoading(false);
    }
  }

  if (!bill) return <div className="p-8 text-gray-400">Đang tải...</div>;

  const attended = bill.sessions.filter((s) => s.isAttended).length;
  const pct = bill.sessionCount > 0 ? Math.round((attended / bill.sessionCount) * 100) : 0;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href={`/students/${bill.student.id}`} className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm">
          <ChevronLeft className="w-4 h-4" /> {bill.student.name}
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-gray-900 font-medium">Hóa đơn #{bill.id}</span>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl font-bold text-gray-900">{formatMoneyVND(bill.totalAmount)}</span>
              <span className={`text-sm px-2.5 py-1 rounded-full font-medium ${bill.status === "paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-600"}`}>
                {bill.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-600 text-sm">{bill.student.name}</span>
              <SubjectBadge subject={bill.student.subject} />
            </div>
            {bill.paidAt && (
              <p className="text-xs text-gray-400 mt-1">Thanh toán lúc {new Date(bill.paidAt).toLocaleString("vi-VN")}</p>
            )}
            {bill.notes && <p className="text-sm text-gray-500 mt-2">{bill.notes}</p>}
          </div>

          {bill.status === "unpaid" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Đánh dấu đã thanh toán
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xác nhận thanh toán</AlertDialogTitle>
                  <AlertDialogDescription>
                    Đánh dấu hóa đơn {formatMoneyVND(bill.totalAmount)} là đã thanh toán?
                    {attended < bill.sessionCount && (
                      <span className="block mt-2 text-orange-600">
                        Lưu ý: còn {bill.sessionCount - attended} buổi chưa điểm danh.
                      </span>
                    )}
                    <span className="block mt-1 text-red-500 text-xs">Hành động này không thể hoàn tác.</span>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                  <AlertDialogAction onClick={markPaid} disabled={payLoading}>
                    {payLoading ? "Đang xử lý..." : "Xác nhận"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Tiến độ điểm danh</span>
            <span>{attended}/{bill.sessionCount} buổi ({pct}%)</span>
          </div>
          <Progress value={pct} />
        </div>
      </div>

      {/* Sessions list */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Danh sách buổi học</h2>
        <div className="space-y-2">
          {bill.sessions
            .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.startTime.localeCompare(b.startTime))
            .map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors ${s.isAttended ? "bg-green-50 border border-green-100" : "bg-gray-50 border border-transparent"}`}
              >
                <Checkbox
                  checked={s.isAttended}
                  onCheckedChange={() => toggleAttended(s.id, s.isAttended)}
                  disabled={bill.status === "paid"}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Buổi {i + 1} — {formatDateVN(s.scheduledDate)}
                  </div>
                  <div className="text-xs text-gray-400">{s.startTime} – {s.endTime}</div>
                </div>
                {s.isAttended && (
                  <span className="text-xs text-green-600 font-medium">✓ Đã học</span>
                )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
