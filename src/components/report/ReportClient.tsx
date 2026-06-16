"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { formatMoneyVND } from "@/lib/time";

interface StudentReport {
  studentId: number;
  name: string;
  subject: "english" | "chinese";
  paid: number;
  unpaid: number;
  total: number;
  sessionsCount: number;
}

interface Report {
  month: string;
  paid: number;
  unpaid: number;
  total: number;
  students: StudentReport[];
}

export default function ReportClient() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/report?month=${month}`)
      .then((r) => r.json())
      .then(setReport)
      .finally(() => setLoading(false));
  }, [month]);

  function changeMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `Tháng ${m} ${y}`;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Báo cáo thu nhập</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium text-gray-700 w-28 text-center">{monthLabel}</span>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">ĐÃ THANH TOÁN</div>
          <div className="text-2xl font-bold text-green-600">{loading ? "..." : formatMoneyVND(report?.paid ?? 0)}</div>
          <div className="h-1 mt-3 bg-green-500 rounded-full" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">CHƯA THANH TOÁN</div>
          <div className="text-2xl font-bold text-orange-500">{loading ? "..." : formatMoneyVND(report?.unpaid ?? 0)}</div>
          <div className="h-1 mt-3 bg-orange-400 rounded-full" />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">TỔNG DỰ KIẾN</div>
          <div className="text-2xl font-bold text-gray-900">{loading ? "..." : formatMoneyVND(report?.total ?? 0)}</div>
          <div className="h-1 mt-3 bg-gray-300 rounded-full" />
        </div>
      </div>

      {/* Per-student table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="font-semibold text-gray-900">Chi tiết theo học sinh</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-pink-50/50 border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-3">HỌC SINH</th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">MÔN</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">ĐÃ THU</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">CHƯA THU</th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 py-3">TỔNG CỘNG</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Đang tải...</td></tr>
            ) : !report?.students.length ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Không có dữ liệu</td></tr>
            ) : report.students.map((s) => (
              <tr key={s.studentId} className="hover:bg-gray-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                      {s.name.split(" ").map((n) => n[0]).slice(-1).join("").toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{s.name}</span>
                  </div>
                </td>
                <td className="px-4 py-4"><SubjectBadge subject={s.subject} /></td>
                <td className="px-4 py-4 text-right text-green-600 font-medium text-sm">{formatMoneyVND(s.paid)}</td>
                <td className="px-4 py-4 text-right text-orange-500 font-medium text-sm">{formatMoneyVND(s.unpaid)}</td>
                <td className="px-4 py-4 text-right font-bold text-gray-900 text-sm">{formatMoneyVND(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
