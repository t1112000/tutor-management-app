"use client";

import { useState } from "react";
import Link from "next/link";
import { SubjectBadge } from "@/components/ui/subject-badge";
import { QueryErrorState } from "@/components/ui/query-error";
import { formatMoneyVND } from "@/lib/time";
import useIsMobile from "@/hooks/use-is-mobile";
import { useAllTimeReport, useReport, type BillReportRow } from "@/hooks/queries/use-report";
import { ReportStatusChart } from "@/components/report/charts/ReportStatusChart";
import { ReportMonthlyTrendChart } from "@/components/report/charts/ReportMonthlyTrendChart";
import { ReportStudentsChart } from "@/components/report/charts/ReportStudentsChart";

type ReportScope = "month" | "all";

function ReportLoadingView({ isMobile }: { isMobile: boolean }) {
  return (
    <div className="flex h-full flex-col overflow-auto">
      <div
        style={{
          height: "64px",
          padding: isMobile ? "0 16px" : "0 32px",
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #F4D8DE",
          background: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div className="animate-pulse" style={{ height: 28, width: 180, borderRadius: 9999, background: "#F4D8DE" }} />
          <div className="animate-pulse" style={{ height: 40, width: isMobile ? 120 : 260, borderRadius: 12, background: "#F4D8DE" }} />
        </div>
      </div>

      <div style={{ padding: isMobile ? "16px" : "24px 32px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px" }}>
              <div className="animate-pulse" style={{ height: 12, width: 88, borderRadius: 9999, background: "#F4D8DE", marginBottom: 18 }} />
              <div className="animate-pulse" style={{ height: 24, width: i === 2 ? 86 : 110, borderRadius: 9999, background: i === 0 ? "#D6F5E3" : i === 1 ? "#FFF3CC" : "#F4D8DE" }} />
              <div className="animate-pulse" style={{ height: 3, width: "100%", borderRadius: 9999, background: "#F4D8DE", marginTop: 16 }} />
            </div>
          ))}
        </div>

        <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "1px solid #F4D8DE" }}>
            <div className="animate-pulse" style={{ height: 16, width: 180, borderRadius: 9999, background: "#F4D8DE" }} />
          </div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ overflow: "hidden", borderRadius: 12, border: "1px solid #F4D8DE" }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr 1fr", background: "#FFF8FA" }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} style={{ padding: "12px 14px", borderRight: i === 4 ? "none" : "1px solid #F4D8DE" }}>
                    <div className="animate-pulse" style={{ height: 12, width: i === 0 ? 70 : 54, borderRadius: 9999, background: "#F4D8DE" }} />
                  </div>
                ))}
              </div>
              {Array.from({ length: 4 }, (_, row) => (
                <div key={row} style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr 1fr 1fr", borderTop: "1px solid #F4D8DE" }}>
                  {Array.from({ length: 5 }, (_, col) => (
                    <div key={col} style={{ padding: "18px 14px", borderRight: col === 4 ? "none" : "1px solid #F4D8DE" }}>
                      <div className="animate-pulse" style={{ height: 12, width: col === 0 ? "80%" : "60%", borderRadius: 9999, background: "#F4D8DE" }} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCards({
  isMobile,
  paid,
  unpaid,
  total,
  billCountLabel,
}: {
  isMobile: boolean;
  paid: number;
  unpaid: number;
  total: number;
  billCountLabel?: string;
}) {
  const paidPct = total > 0 ? `${Math.round((paid / total) * 100)}%` : "0%";
  const unpaidPct = total > 0 ? `${Math.round((unpaid / total) * 100)}%` : "0%";

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : billCountLabel ? "repeat(4,1fr)" : "repeat(3,1fr)", gap: "16px", marginBottom: "24px" }}>
      <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Đã thanh toán</div>
        <div style={{ fontSize: "26px", fontWeight: 700, color: "#1a8a3c", letterSpacing: "-0.8px" }}>
          {formatMoneyVND(paid)}
        </div>
        <div style={{ height: "3px", background: "rgba(27,143,68,0.2)", borderRadius: "9999px", marginTop: "10px" }}>
          <div style={{ height: "3px", background: "#1a8a3c", borderRadius: "9999px", width: paidPct }} />
        </div>
      </div>
      <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Chưa thanh toán</div>
        <div style={{ fontSize: "26px", fontWeight: 700, color: "#b45309", letterSpacing: "-0.8px" }}>
          {formatMoneyVND(unpaid)}
        </div>
        <div style={{ height: "3px", background: "rgba(180,83,9,0.2)", borderRadius: "9999px", marginTop: "10px" }}>
          <div style={{ height: "3px", background: "#b45309", borderRadius: "9999px", width: unpaidPct }} />
        </div>
      </div>
      <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px" }}>
        <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Tổng dự kiến</div>
        <div style={{ fontSize: "26px", fontWeight: 700, color: "#2C1820", letterSpacing: "-0.8px" }}>
          {formatMoneyVND(total)}
        </div>
        <div style={{ height: "3px", background: "rgba(232,120,138,0.15)", borderRadius: "9999px", marginTop: "10px" }}>
          <div style={{ height: "3px", background: "#E8788A", borderRadius: "9999px", width: "100%" }} />
        </div>
      </div>
      {billCountLabel ? (
        <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "20px 22px" }}>
          <div style={{ fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>Hóa đơn</div>
          <div style={{ fontSize: "26px", fontWeight: 700, color: "#2C1820", letterSpacing: "-0.8px" }}>
            {billCountLabel}
          </div>
          <div style={{ height: "3px", background: "rgba(232,120,138,0.15)", borderRadius: "9999px", marginTop: "10px" }}>
            <div style={{ height: "3px", background: "#E8788A", borderRadius: "9999px", width: "100%" }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ScopeToggle({
  scope,
  onChange,
}: {
  scope: ReportScope;
  onChange: (s: ReportScope) => void;
}) {
  const btn = (value: ReportScope, label: string) => {
    const active = scope === value;
    return (
      <button
        type="button"
        onClick={() => onChange(value)}
        style={{
          border: "none",
          cursor: "pointer",
          padding: "6px 12px",
          borderRadius: "6px",
          fontSize: "13px",
          fontWeight: 500,
          background: active ? "white" : "transparent",
          color: active ? "#2C1820" : "#A87888",
          boxShadow: active ? "0 1px 2px rgba(44,24,32,0.08)" : "none",
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "2px",
        background: "#FFF8FA",
        border: "1px solid #F4D8DE",
        borderRadius: "8px",
        padding: "3px",
      }}
    >
      {btn("month", "Theo tháng")}
      {btn("all", "Toàn bộ")}
    </div>
  );
}

function MonthPicker({
  monthLabel,
  onChange,
}: {
  monthLabel: string;
  onChange: (delta: number) => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#FFF8FA", border: "1px solid #F4D8DE", borderRadius: "8px", padding: "6px 10px" }}>
      <button
        type="button"
        onClick={() => onChange(-1)}
        style={{ width: "24px", height: "24px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <span style={{ fontSize: "13px", fontWeight: 500, color: "#2C1820", minWidth: "120px", textAlign: "center" }}>
        {monthLabel}
      </span>
      <button
        type="button"
        onClick={() => onChange(1)}
        style={{ width: "24px", height: "24px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "4px" }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#62666d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  );
}

function StatusPill({ status }: { status: "paid" | "unpaid" }) {
  const paid = status === "paid";
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: "11px",
        fontWeight: 600,
        padding: "3px 8px",
        borderRadius: 9999,
        background: paid ? "rgba(26,138,60,0.12)" : "rgba(180,83,9,0.12)",
        color: paid ? "#1a8a3c" : "#b45309",
      }}
    >
      {paid ? "Đã thu" : "Chưa thu"}
    </span>
  );
}

function BillsList({ bills, isMobile }: { bills: BillReportRow[]; isMobile: boolean }) {
  if (!bills.length) {
    return (
      <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>
        Chưa có hóa đơn
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {bills.map((b) => (
          <Link
            key={b.id}
            href={`/bills/${b.id}`}
            style={{
              display: "block",
              background: "white",
              border: "1px solid #F4D8DE",
              borderRadius: "12px",
              padding: "14px 16px",
              textDecoration: "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820" }}>{b.studentName}</div>
                <SubjectBadge subject={b.subject} />
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#2C1820" }}>{formatMoneyVND(b.totalAmount)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <span style={{ fontSize: "12px", color: "#A87888" }}>
                {b.month ? `Tháng ${b.month.slice(5)}/${b.month.slice(0, 4)}` : "Chưa gán tháng"}
              </span>
              <StatusPill status={b.status} />
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr style={{ background: "#FFF8FA" }}>
          <th style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Học sinh</th>
          <th style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Môn</th>
          <th style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Tháng</th>
          <th style={{ padding: "9px 16px", textAlign: "left", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Trạng thái</th>
          <th style={{ padding: "9px 16px", textAlign: "right", fontSize: "11px", fontWeight: 500, color: "#A87888", textTransform: "uppercase", letterSpacing: "0.4px" }}>Số tiền</th>
        </tr>
      </thead>
      <tbody>
        {bills.map((b) => (
          <tr key={b.id} style={{ borderTop: "1px solid #F4D8DE" }}>
            <td style={{ padding: "12px 16px" }}>
              <Link href={`/bills/${b.id}`} style={{ fontSize: "13px", fontWeight: 500, color: "#2C1820", textDecoration: "none" }}>
                {b.studentName}
              </Link>
            </td>
            <td style={{ padding: "12px 16px" }}><SubjectBadge subject={b.subject} /></td>
            <td style={{ padding: "12px 16px", fontSize: "13px", color: "#62666d" }}>
              {b.month ? `${b.month.slice(5)}/${b.month.slice(0, 4)}` : "—"}
            </td>
            <td style={{ padding: "12px 16px" }}><StatusPill status={b.status} /></td>
            <td style={{ padding: "12px 16px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: "#2C1820" }}>
              <Link href={`/bills/${b.id}`} style={{ color: "inherit", textDecoration: "none" }}>
                {formatMoneyVND(b.totalAmount)}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StudentsTable({
  students,
  isMobile,
}: {
  students: Array<{
    studentId: number;
    name: string;
    subject: "english" | "chinese";
    paid: number;
    unpaid: number;
    total: number;
  }>;
  isMobile: boolean;
}) {
  if (isMobile) {
    return (
      <div style={{ padding: "12px 14px" }}>
        {!students.length ? (
          <div style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Không có dữ liệu</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {students.map((s) => (
              <div key={s.studentId} style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "9999px", background: "rgba(59,111,212,0.13)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3b6fd4", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                      {s.name.split(" ").slice(-1)[0]?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820" }}>{s.name}</div>
                      <SubjectBadge subject={s.subject} />
                    </div>
                  </div>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#1a8a3c" }}>{formatMoneyVND(s.total)}</div>
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#A87888" }}>Đã thu</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#1a8a3c" }}>{formatMoneyVND(s.paid)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#A87888" }}>Chưa thu</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#b45309" }}>{formatMoneyVND(s.unpaid)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
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
        {!students.length ? (
          <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", fontSize: "13px", color: "#A87888" }}>Không có dữ liệu</td></tr>
        ) : students.map((s) => (
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
  );
}

export default function ReportClient() {
  const isMobile = useIsMobile();
  const [scope, setScope] = useState<ReportScope>("month");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const monthly = useReport(month);
  const allTime = useAllTimeReport(scope === "all");

  function changeMonth(delta: number) {
    const [y, m] = month.split("-").map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const [y, m] = month.split("-").map(Number);
  const monthLabel = `Tháng ${m} ${y}`;

  const loading = scope === "month" ? monthly.isLoading : allTime.isLoading;
  const isError = scope === "month" ? monthly.isError : allTime.isError;
  const refetch = scope === "month" ? monthly.refetch : allTime.refetch;

  if (loading) {
    return <ReportLoadingView isMobile={isMobile} />;
  }

  // Rendering "0 đ" when the request actually failed is worse than an error for
  // a revenue report — the tutor cannot tell an empty month from a dead network.
  if (isError) {
    return (
      <div className="flex h-full items-center justify-center">
        <QueryErrorState message="Không tải được báo cáo" onRetry={() => refetch()} />
      </div>
    );
  }

  const report = scope === "month" ? monthly.data : null;
  const all = scope === "all" ? allTime.data : null;

  const paid = scope === "month" ? (report?.paid ?? 0) : (all?.paid ?? 0);
  const unpaid = scope === "month" ? (report?.unpaid ?? 0) : (all?.unpaid ?? 0);
  const total = scope === "month" ? (report?.total ?? 0) : (all?.total ?? 0);
  const hasData = scope === "month" ? (report?.totalBillCount ?? 0) > 0 : (all?.totalBillCount ?? 0) > 0;
  const chartHeight = isMobile ? 220 : 260;

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Sticky header */}
      <div style={{ height: isMobile ? "auto" : "64px", minHeight: "64px", padding: isMobile ? "12px 16px" : "0 32px", display: "flex", alignItems: "center", borderBottom: "1px solid #F4D8DE", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
        <div style={{ width: "100%", display: "flex", flexDirection: isMobile ? "column" : "row", alignItems: isMobile ? "stretch" : "center", justifyContent: "space-between", gap: isMobile ? 10 : 12 }}>
          <h1 style={{ fontSize: isMobile ? "20px" : "22px", fontWeight: 600, color: "#2C1820", letterSpacing: "-0.5px", margin: 0 }}>
            Báo cáo thu nhập
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <ScopeToggle scope={scope} onChange={setScope} />
            {scope === "month" ? (
              <MonthPicker monthLabel={monthLabel} onChange={changeMonth} />
            ) : null}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: isMobile ? "16px" : "24px 32px" }}>
        <SummaryCards
          isMobile={isMobile}
          paid={paid}
          unpaid={unpaid}
          total={total}
          billCountLabel={
            scope === "all" && all
              ? `${all.totalBillCount}`
              : undefined
          }
        />

        {hasData ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : scope === "all" ? "1fr 1fr" : "1fr 1fr",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <ReportStatusChart paid={paid} unpaid={unpaid} height={chartHeight} />
            {scope === "all" && all && all.byMonth.length > 0 ? (
              <ReportMonthlyTrendChart byMonth={all.byMonth} height={chartHeight} />
            ) : scope === "month" && report && report.students.length > 0 ? (
              <ReportStudentsChart students={report.students} height={chartHeight} />
            ) : (
              <ReportStudentsChart students={all?.students ?? []} height={chartHeight} />
            )}
          </div>
        ) : null}

        {scope === "month" ? (
          <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #F4D8DE" }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820" }}>Chi tiết theo học sinh</div>
            </div>
            <StudentsTable students={report?.students ?? []} isMobile={isMobile} />
          </div>
        ) : (
          <div style={{ background: "white", border: "1px solid #F4D8DE", borderRadius: "12px", overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid #F4D8DE", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C1820" }}>Tất cả hóa đơn</div>
              <span style={{ fontSize: "13px", color: "#A87888" }}>
                {all?.totalBillCount ?? 0} hóa đơn
              </span>
            </div>
            <BillsList bills={all?.bills ?? []} isMobile={isMobile} />
          </div>
        )}
      </div>
    </div>
  );
}
