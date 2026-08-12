import { describe, expect, it } from "vitest";
import {
  billMonth,
  computeAllTimeReport,
  computeMonthlyReport,
  monthLabel,
  statusBreakdown,
  type ReportBillInput,
} from "./report";

const student = { id: 1, name: "An", subject: "english" };

function bill(overrides: Partial<ReportBillInput> = {}): ReportBillInput {
  return {
    id: 1,
    status: "unpaid",
    totalAmount: 500000,
    startDate: "2026-07-27",
    student,
    sessions: [
      { scheduledDate: "2026-07-27", isAttended: true },
      { scheduledDate: "2026-08-03", isAttended: true },
    ],
    ...overrides,
  };
}

describe("billMonth", () => {
  it("uses the start date when present", () => {
    expect(billMonth(bill({ startDate: "2026-07-27" }))).toBe("2026-07");
  });

  it("falls back to the earliest session when there is no start date", () => {
    expect(billMonth(bill({ startDate: null }))).toBe("2026-07");
  });

  it("returns null when there is nothing to attribute", () => {
    expect(billMonth(bill({ startDate: null, sessions: [] }))).toBeNull();
  });
});

describe("computeMonthlyReport", () => {
  it("counts an invoice spanning two months in exactly one of them", () => {
    const bills = [bill()];
    const july = computeMonthlyReport(bills, "2026-07");
    const august = computeMonthlyReport(bills, "2026-08");

    expect(july.total).toBe(500000);
    expect(july.totalBillCount).toBe(1);
    // The old code added the full amount to both months, inflating revenue.
    expect(august.total).toBe(0);
    expect(august.totalBillCount).toBe(0);
  });

  it("splits paid and unpaid totals", () => {
    const report = computeMonthlyReport(
      [
        bill({ id: 1, status: "paid", totalAmount: 500000 }),
        bill({ id: 2, status: "unpaid", totalAmount: 300000 }),
      ],
      "2026-07"
    );
    expect(report.paid).toBe(500000);
    expect(report.unpaid).toBe(300000);
    expect(report.total).toBe(800000);
    expect(report.unpaidBillCount).toBe(1);
  });

  it("accepts the decimal strings Sequelize returns for money columns", () => {
    const report = computeMonthlyReport([bill({ totalAmount: "500000" })], "2026-07");
    expect(report.total).toBe(500000);
  });

  it("counts only attended sessions that fall inside the reported month", () => {
    const report = computeMonthlyReport(
      [
        bill({
          sessions: [
            { scheduledDate: "2026-07-27", isAttended: true },
            { scheduledDate: "2026-07-28", isAttended: false },
            { scheduledDate: "2026-08-03", isAttended: true },
          ],
        }),
      ],
      "2026-07"
    );
    expect(report.students[0].sessionsCount).toBe(1);
  });

  it("groups multiple invoices under one student row", () => {
    const report = computeMonthlyReport(
      [bill({ id: 1, totalAmount: 100000 }), bill({ id: 2, totalAmount: 200000 })],
      "2026-07"
    );
    expect(report.students).toHaveLength(1);
    expect(report.students[0].total).toBe(300000);
  });

  it("keeps students separate", () => {
    const other = { id: 2, name: "Bình", subject: "chinese" };
    const report = computeMonthlyReport(
      [bill({ id: 1 }), bill({ id: 2, student: other, totalAmount: 700000 })],
      "2026-07"
    );
    expect(report.students).toHaveLength(2);
    expect(report.total).toBe(1200000);
  });

  it("ignores invoices whose student is missing", () => {
    const report = computeMonthlyReport([bill({ student: null })], "2026-07");
    expect(report.totalBillCount).toBe(0);
    expect(report.total).toBe(0);
  });

  it("returns an empty report for a month with no invoices", () => {
    const report = computeMonthlyReport([], "2026-07");
    expect(report).toMatchObject({ month: "2026-07", paid: 0, unpaid: 0, total: 0, students: [] });
  });
});

describe("monthLabel", () => {
  it("formats YYYY-MM as MM/YY", () => {
    expect(monthLabel("2026-07")).toBe("07/26");
  });
});

describe("statusBreakdown", () => {
  it("returns paid and unpaid rows for charts", () => {
    expect(statusBreakdown(500000, 300000)).toEqual([
      { status: "Đã thu", amount: 500000 },
      { status: "Chưa thu", amount: 300000 },
    ]);
  });
});

describe("computeAllTimeReport", () => {
  it("returns zeros for an empty list", () => {
    const report = computeAllTimeReport([]);
    expect(report).toMatchObject({
      paid: 0,
      unpaid: 0,
      total: 0,
      totalBillCount: 0,
      unpaidBillCount: 0,
      students: [],
      bills: [],
      byMonth: [],
    });
  });

  it("splits paid and unpaid grand totals", () => {
    const report = computeAllTimeReport([
      bill({ id: 1, status: "paid", totalAmount: 500000 }),
      bill({ id: 2, status: "unpaid", totalAmount: 300000 }),
    ]);
    expect(report.paid).toBe(500000);
    expect(report.unpaid).toBe(300000);
    expect(report.total).toBe(800000);
    expect(report.totalBillCount).toBe(2);
    expect(report.unpaidBillCount).toBe(1);
  });

  it("accepts decimal strings for money columns", () => {
    const report = computeAllTimeReport([bill({ totalAmount: "500000" })]);
    expect(report.total).toBe(500000);
    expect(report.bills[0].totalAmount).toBe(500000);
  });

  it("ignores invoices whose student is missing", () => {
    const report = computeAllTimeReport([bill({ student: null })]);
    expect(report.totalBillCount).toBe(0);
    expect(report.bills).toHaveLength(0);
  });

  it("builds bill rows with month attribution", () => {
    const report = computeAllTimeReport([
      bill({ id: 10, startDate: "2026-07-01", status: "paid" }),
    ]);
    expect(report.bills).toEqual([
      expect.objectContaining({
        id: 10,
        studentId: 1,
        studentName: "An",
        status: "paid",
        month: "2026-07",
        totalAmount: 500000,
      }),
    ]);
  });

  it("sorts bills by month desc then id desc", () => {
    const report = computeAllTimeReport([
      bill({ id: 1, startDate: "2026-06-01", totalAmount: 100000 }),
      bill({ id: 3, startDate: "2026-08-01", totalAmount: 200000 }),
      bill({ id: 2, startDate: "2026-08-15", totalAmount: 300000 }),
    ]);
    // August ids 3 then 2 (id desc), then June id 1
    expect(report.bills.map((b) => b.id)).toEqual([3, 2, 1]);
  });

  it("buckets months ascending for chart series", () => {
    const report = computeAllTimeReport([
      bill({ id: 1, startDate: "2026-08-01", status: "paid", totalAmount: 200000 }),
      bill({ id: 2, startDate: "2026-06-01", status: "unpaid", totalAmount: 100000 }),
      bill({ id: 3, startDate: "2026-08-10", status: "unpaid", totalAmount: 50_000 }),
    ]);
    expect(report.byMonth.map((m) => m.month)).toEqual(["2026-06", "2026-08"]);
    expect(report.byMonth[0]).toMatchObject({
      label: "06/26",
      paid: 0,
      unpaid: 100000,
      total: 100000,
      billCount: 1,
    });
    expect(report.byMonth[1]).toMatchObject({
      label: "08/26",
      paid: 200000,
      unpaid: 50_000,
      total: 250000,
      billCount: 2,
    });
  });

  it("aggregates students all-time and counts all attended sessions", () => {
    const other = { id: 2, name: "Bình", subject: "chinese" };
    const report = computeAllTimeReport([
      bill({
        id: 1,
        totalAmount: 100000,
        sessions: [
          { scheduledDate: "2026-07-01", isAttended: true },
          { scheduledDate: "2026-08-01", isAttended: true },
          { scheduledDate: "2026-08-08", isAttended: false },
        ],
      }),
      bill({ id: 2, student: other, totalAmount: 700000, status: "paid" }),
    ]);
    expect(report.students).toHaveLength(2);
    const an = report.students.find((s) => s.studentId === 1)!;
    expect(an.total).toBe(100000);
    expect(an.sessionsCount).toBe(2);
    expect(report.total).toBe(800000);
  });

  it("excludes null-month bills from byMonth but keeps them in the list", () => {
    const report = computeAllTimeReport([
      bill({ id: 1, startDate: null, sessions: [] }),
    ]);
    expect(report.bills).toHaveLength(1);
    expect(report.bills[0].month).toBeNull();
    expect(report.byMonth).toHaveLength(0);
    expect(report.total).toBe(500000);
  });
});
