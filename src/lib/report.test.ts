import { describe, expect, it } from "vitest";
import { billMonth, computeMonthlyReport, type ReportBillInput } from "./report";

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
