"use client";

import { useEffect, useState } from "react";
import { Users, Receipt, DollarSign, ChevronRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { formatMoneyVND, todayVN, VN_DAY_NAMES } from "@/lib/time";

interface Stats {
  activeStudents: number;
  unpaidBills: number;
  unpaidTotal: number;
  todaySessions: Array<{
    id: number;
    startTime: string;
    endTime: string;
    scheduledDate: string;
    bill: {
      id: number;
      student: { name: string; subject: "english" | "chinese" };
    };
  }>;
  weekSessionCount: number;
}

function getTodayLabel() {
  const d = new Date();
  const dow = d.getDay();
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${VN_DAY_NAMES[dow]}, ${day}/${month}/${year}`;
}

interface DashboardContentProps {
  userId: number;
}

export default function DashboardContent({ userId }: DashboardContentProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [studentsRes, reportRes, calendarRes] = await Promise.all([
          fetch("/api/students"),
          fetch(`/api/report?month=${new Date().toISOString().slice(0, 7)}`),
          fetch(`/api/calendar?weekStart=${getWeekStart()}`),
        ]);
        const students = await studentsRes.json();
        const report = await reportRes.json();
        const calendarSessions = await calendarRes.json();

        const today = new Date().toISOString().slice(0, 10);
        const todaySessions = calendarSessions.filter((s: any) => s.scheduledDate === today);

        setStats({
          activeStudents: students.length,
          unpaidBills: students.reduce((a: number, s: any) => a + (s.bills?.filter((b: any) => b.status === "unpaid").length ?? 0), 0),
          unpaidTotal: report.unpaid,
          todaySessions,
          weekSessionCount: calendarSessions.length,
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function getWeekStart() {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return monday.toISOString().slice(0, 10);
  }

  return (
    <div className="p-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">TỔNG QUAN</p>
          <h1 className="text-3xl font-bold text-gray-900">Chào buổi sáng!</h1>
        </div>
        <span className="text-sm text-gray-500 mt-1">{getTodayLabel()}</span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">HỌC SINH ĐANG HỌC</span>
          </div>
          <div className="text-4xl font-bold text-gray-900 mb-1">{loading ? "—" : stats?.activeStudents}</div>
          <div className="text-sm text-gray-400">học sinh hoạt động</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-orange-500" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">HÓA ĐƠN CHƯA THU</span>
          </div>
          <div className="text-4xl font-bold text-orange-500 mb-1">{loading ? "—" : stats?.unpaidBills}</div>
          <div className="text-sm text-gray-400">hóa đơn chưa thanh toán</div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">TỔNG CHƯA THU</span>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {loading ? "—" : formatMoneyVND(stats?.unpaidTotal ?? 0)}
          </div>
          <div className="text-sm text-gray-400">tổng tiền còn lại</div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-5 gap-4">
        {/* Today's schedule */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Lịch dạy hôm nay</h2>
            <Link href="/calendar" className="text-sm text-primary hover:underline flex items-center gap-1">
              Xem lịch <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {loading ? (
            <div className="text-sm text-gray-400">Đang tải...</div>
          ) : !stats?.todaySessions.length ? (
            <div className="text-sm text-gray-400">Không có buổi dạy hôm nay</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {stats.todaySessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold text-gray-800">{s.startTime}</div>
                    <div className="text-xs text-gray-400">{s.endTime}</div>
                  </div>
                  <div className="font-medium text-gray-900 flex-1 ml-6">{s.bill?.student?.name}</div>
                  <SubjectBadge subject={s.bill?.student?.subject} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="col-span-2 flex flex-col gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1">TRUY CẬP NHANH</p>
          <Link href="/students" className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Danh sách học sinh</div>
                <div className="text-xs text-gray-400">Quản lý {loading ? "..." : stats?.activeStudents} học sinh</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
          <Link href="/calendar" className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Lịch dạy tuần này</div>
                <div className="text-xs text-gray-400">{loading ? "..." : stats?.weekSessionCount} buổi học tuần này</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
          <Link href="/report" className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-pink-50 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium text-gray-900 text-sm">Báo cáo thu nhập</div>
                <div className="text-xs text-gray-400">Xem doanh thu tháng {new Date().getMonth() + 1}</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        </div>
      </div>
    </div>
  );
}
