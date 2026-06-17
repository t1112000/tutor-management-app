"use client";

import { useEffect, useState } from "react";
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

const hdrStyle: React.CSSProperties = {
  height: "64px",
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
};

export default function ReportClient() {
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
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

  const total = report?.total ?? 0;
  const paid = report?.paid ?? 0;
  const unpaid = report?.unpaid ?? 0;
  const paidPct = total > 0 ? `${Math.round((paid / total) * 100)}%` : "0%";
  const unpaidPct = total > 0 ? `${Math.round((unpaid / total) * 100)}%` : "0%";

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Sticky header */}
      <div style={hdrStyle}>
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#2C1820", letterSpacing: "-0.5px", margin: 0 }}>
            Báo cáo thu nhập
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "6px 10px" }}>
            <button
              onClick={() => changeMonth(-1)}
              style={{ width: "24px", height: "24px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#2C1820", minWidth: "120px", textAlign: "center" }}>
              {monthLabel}
            </span>
            <button
              onClick={() => changeMonth(1)}
              style={{ width: "24px", height: "24px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "24px 32px" }}>
        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
          {/* Paid */}
          <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px" }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Đã thanh toán</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "#1a8a3c", letterSpacing: "-0.8px" }}>
              {loading ? "..." : formatMoneyVND(paid)}
            </div>
            <div style={{ height: "3px", background: "rgba(27,143,68,0.2)", borderRadius: "9999px", marginTop: "10px" }}>
              <div style={{ height: "3px", background: "#1a8a3c", borderRadius: "9999px", width: paidPct }} />
            </div>
          </div>
          {/* Unpaid */}
          <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px" }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Chưa thanh toán</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "#b45309", letterSpacing: "-0.8px" }}>
              {loading ? "..." : formatMoneyVND(unpaid)}
            </div>
            <div style={{ height: "3px", background: "rgba(180,83,9,0.2)", borderRadius: "9999px", marginTop: "10px" }}>
              <div style={{ height: "3px", background: "#b45309", borderRadius: "9999px", width: unpaidPct }} />
            </div>
          </div>
          {/* Total */}
          <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px" }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Tổng dự kiến</div>
            <div style={{ fontSize: "26px", fontWeight: 700, color: "#2C1820", letterSpacing: "-0.8px" }}>
              {loading ? "..." : formatMoneyVND(total)}
            </div>
            <div style={{ height: "3px", background: "rgba(232,120,138,0.15)", borderRadius: "9999px", marginTop: "10px" }}>
              <div style={{ height: "3px", background: "#E8788A", borderRadius: "9999px", width: "100%" }} />
            </div>
          </div>
        </div>

        {/* Per-student table */}
        <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #F4D8DE" }}>
            <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820" }}>Chi tiết theo học sinh</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FFF8FA" }}>
                <th style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Học sinh</th>
                <th style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Môn</th>
                <th style={{ padding: "9px 16px", textAlign: "right", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Đã thu</th>
                <th style={{ padding: "9px 16px", textAlign: "right", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Chưa thu</th>
                <th style={{ padding: "9px 16px", textAlign: "right", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Tổng cộng</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Đang tải...</td></tr>
              ) : !report?.students.length ? (
                <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Không có dữ liệu</td></tr>
              ) : report.students.map((s) => (
                <tr key={s.studentId} style={{ borderTop: "1px solid #F4D8DE" }}>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "9999px", background: "rgba(59,111,212,0.13)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b6fd4", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                        {s.name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "?"}
                      </div>
                      <span style={{ fontSize: "13px", fontWeight: 500, color: "#2C1820" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}><SubjectBadge subject={s.subject} /></td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", fontWeight: 500, color: "#1a8a3c" }}>{formatMoneyVND(s.paid)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px", fontWeight: 500, color: "#b45309" }}>{formatMoneyVND(s.unpaid)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: "#2C1820" }}>{formatMoneyVND(s.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
