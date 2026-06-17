"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { formatMoneyVND, VN_DAY_NAMES } from "@/lib/time";
import useIsMobile from "@/hooks/use-is-mobile";

interface Stats {
  activeStudents: number;
  unpaidBills: number;
  unpaidTotal: number;
  todaySessions: Array<{
    id: number;
    startTime: string;
    endTime: string;
    scheduledDate: string;
    bill: { id: number; student: { name: string; subject: "english" | "chinese" } };
  }>;
  weekSessionCount: number;
}

function getTodayLabel() {
  const d = new Date();
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear();
  return `${VN_DAY_NAMES[d.getDay()]}, ${day}/${month}/${year}`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng!";
  if (h < 18) return "Chào buổi chiều!";
  return "Chào buổi tối!";
}

const cardStyle: React.CSSProperties = {
  background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px",
};

export default function DashboardContent({ userId }: { userId: number }) {
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<Stats | null>(null);

  const hdrStyle: React.CSSProperties = {
    height: "64px", padding: isMobile ? "0 16px" : "0 32px", display: "flex", alignItems: "center",
    borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0,
  };
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
        setStats({
          activeStudents: students.length,
          unpaidBills: students.reduce((a: number, s: any) => a + (s.bills?.filter((b: any) => b.status === "unpaid").length ?? 0), 0),
          unpaidTotal: report.unpaid,
          todaySessions: calendarSessions.filter((s: any) => s.scheduledDate === today),
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
    const diff = d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1);
    return new Date(new Date(d).setDate(diff)).toISOString().slice(0, 10);
  }

  const chevron = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9098a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  );

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Sticky header */}
      <div style={hdrStyle}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#2C1820", letterSpacing: "-0.4px", margin: 0 }}>
            {getGreeting()}
          </h1>
          <div style={{ fontSize: "13px", color: "#A87888" }}>{getTodayLabel()}</div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: isMobile ? "16px" : "24px 32px" }}>
        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "16px", marginBottom: "28px" }}>
          {/* Students */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "34px", height: "34px", background: "#FFE8EC", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#C45870" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Học sinh đang học</span>
            </div>
            <div style={{ fontSize: "38px", fontWeight: 700, color: "#C45870", letterSpacing: "-1.5px", lineHeight: 1 }}>{loading ? "—" : stats?.activeStudents}</div>
            <div style={{ fontSize: "12px", color: "#A87888", marginTop: "5px" }}>học sinh hoạt động</div>
          </div>
          {/* Bills */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "34px", height: "34px", background: "#FFF3CC", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#9A5A00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Hóa đơn chưa thu</span>
            </div>
            <div style={{ fontSize: "38px", fontWeight: 700, color: "#b45309", letterSpacing: "-1.5px", lineHeight: 1 }}>{loading ? "—" : stats?.unpaidBills}</div>
            <div style={{ fontSize: "12px", color: "#A87888", marginTop: "5px" }}>hóa đơn chưa thanh toán</div>
          </div>
          {/* Money */}
          <div style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <div style={{ width: "34px", height: "34px", background: "#D6F5E3", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#1A7A40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tổng chưa thu</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: 700, color: "#1a8a3c", letterSpacing: "-0.8px", lineHeight: 1 }}>{loading ? "—" : formatMoneyVND(stats?.unpaidTotal ?? 0)}</div>
            <div style={{ fontSize: "12px", color: "#A87888", marginTop: "5px" }}>tổng tiền còn lại</div>
          </div>
        </div>

        {/* Bottom: schedule + quick links */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: "20px" }}>
          {/* Today's schedule */}
          <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "15px 20px", borderBottom: "1px solid #F4D8DE", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820" }}>Lịch dạy hôm nay</div>
              <Link href="/calendar" style={{ fontSize: "12px", color: "#E8788A", fontWeight: 500, textDecoration: "none" }}>Xem lịch →</Link>
            </div>
            {loading ? (
              <div style={{ padding: "20px", fontSize: "13px", color: "#A87888" }}>Đang tải...</div>
            ) : !stats?.todaySessions.length ? (
              <div style={{ padding: "20px", fontSize: "13px", color: "#A87888" }}>Không có buổi dạy hôm nay</div>
            ) : stats.todaySessions.map((s) => (
              <div key={s.id} style={{ padding: "13px 20px", borderBottom: "1px solid #F4D8DE", display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ width: "68px", flexShrink: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#2C1820", fontFamily: "monospace" }}>{s.startTime}</div>
                  <div style={{ fontSize: "11px", color: "#A87888", fontFamily: "monospace" }}>{s.endTime}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#2C1820", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.bill?.student?.name}</div>
                </div>
                <SubjectBadge subject={s.bill?.student?.subject} />
              </div>
            ))}
          </div>

          {/* Quick access */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px" }}>Truy cập nhanh</div>
            <Link href="/students" style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <div style={{ width: "36px", height: "36px", background: "#E0EEFF", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E64C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#2C1820" }}>Danh sách học sinh</div>
                <div style={{ fontSize: "11px", color: "#A87888" }}>Quản lý {loading ? "..." : stats?.activeStudents} học sinh</div>
              </div>
              {chevron}
            </Link>
            <Link href="/calendar" style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <div style={{ width: "36px", height: "36px", background: "#D6F5E3", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A7A40" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#2C1820" }}>Lịch dạy tuần này</div>
                <div style={{ fontSize: "11px", color: "#A87888" }}>{loading ? "..." : stats?.weekSessionCount} buổi học tuần này</div>
              </div>
              {chevron}
            </Link>
            <Link href="/report" style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
              <div style={{ width: "36px", height: "36px", background: "#FFE5E8", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2354A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px", fontWeight: 500, color: "#2C1820" }}>Báo cáo thu nhập</div>
                <div style={{ fontSize: "11px", color: "#A87888" }}>Xem doanh thu tháng {new Date().getMonth() + 1}</div>
              </div>
              {chevron}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
