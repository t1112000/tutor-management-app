export interface ReportBillInput {
  id: number;
  status: "unpaid" | "paid";
  totalAmount: number | string;
  startDate: string | null;
  student: { id: number; name: string; subject: string } | null;
  sessions: Array<{ scheduledDate: string; isAttended: boolean }>;
}

export interface StudentReportRow {
  studentId: number;
  name: string;
  subject: string;
  paid: number;
  unpaid: number;
  total: number;
  sessionsCount: number;
}

export interface MonthlyReport {
  month: string;
  paid: number;
  unpaid: number;
  totalBillCount: number;
  unpaidBillCount: number;
  total: number;
  students: StudentReportRow[];
}

export interface BillReportRow {
  id: number;
  studentId: number;
  studentName: string;
  subject: string;
  status: "unpaid" | "paid";
  totalAmount: number;
  month: string | null;
  startDate: string | null;
}

/** One calendar month bucket for charts (YYYY-MM). */
export interface MonthBucket {
  month: string;
  label: string;
  paid: number;
  unpaid: number;
  total: number;
  billCount: number;
}

export interface AllTimeReport {
  paid: number;
  unpaid: number;
  total: number;
  totalBillCount: number;
  unpaidBillCount: number;
  students: StudentReportRow[];
  bills: BillReportRow[];
  byMonth: MonthBucket[];
}

export interface StatusBreakdownRow {
  status: string;
  amount: number;
}

/**
 * The month an invoice belongs to. An invoice whose sessions straddle a month
 * boundary used to be counted at full value in *both* months, so the monthly
 * totals added up to more than the real revenue. Attribute it to exactly one
 * month: its start date, or failing that its earliest session.
 */
export function billMonth(bill: ReportBillInput): string | null {
  if (bill.startDate) return bill.startDate.slice(0, 7);
  const dates = bill.sessions.map((s) => s.scheduledDate).sort();
  return dates.length > 0 ? dates[0].slice(0, 7) : null;
}

/** Compact axis label for charts: "07/26" from "2026-07". */
export function monthLabel(month: string): string {
  const [y, m] = month.split("-");
  return `${m}/${y.slice(2)}`;
}

export function statusBreakdown(paid: number, unpaid: number): StatusBreakdownRow[] {
  return [
    { status: "Đã thu", amount: paid },
    { status: "Chưa thu", amount: unpaid },
  ];
}

function emptyStudentRow(
  student: { id: number; name: string; subject: string }
): StudentReportRow {
  return {
    studentId: student.id,
    name: student.name,
    subject: student.subject,
    paid: 0,
    unpaid: 0,
    total: 0,
    sessionsCount: 0,
  };
}

export function computeMonthlyReport(bills: ReportBillInput[], month: string): MonthlyReport {
  let paid = 0;
  let unpaid = 0;
  let unpaidBillCount = 0;
  let totalBillCount = 0;
  const byStudent = new Map<number, StudentReportRow>();

  for (const bill of bills) {
    if (!bill.student) continue;
    if (billMonth(bill) !== month) continue;

    totalBillCount += 1;
    const amount = Number(bill.totalAmount);
    const student = bill.student;

    let row = byStudent.get(student.id);
    if (!row) {
      row = emptyStudentRow(student);
      byStudent.set(student.id, row);
    }

    // Only sessions taught inside the reported month count as taught sessions.
    row.sessionsCount += bill.sessions.filter(
      (s) => s.isAttended && s.scheduledDate.slice(0, 7) === month
    ).length;

    if (bill.status === "paid") {
      paid += amount;
      row.paid += amount;
    } else {
      unpaid += amount;
      unpaidBillCount += 1;
      row.unpaid += amount;
    }
    row.total += amount;
  }

  return {
    month,
    paid,
    unpaid,
    totalBillCount,
    unpaidBillCount,
    total: paid + unpaid,
    students: [...byStudent.values()],
  };
}

/**
 * All non-deleted invoices for a tutor: grand totals, per-student rows,
 * individual bill rows, and monthly buckets for charts.
 */
export function computeAllTimeReport(bills: ReportBillInput[]): AllTimeReport {
  let paid = 0;
  let unpaid = 0;
  let unpaidBillCount = 0;
  let totalBillCount = 0;
  const byStudent = new Map<number, StudentReportRow>();
  const byMonth = new Map<string, MonthBucket>();
  const billRows: BillReportRow[] = [];

  for (const bill of bills) {
    if (!bill.student) continue;

    totalBillCount += 1;
    const amount = Number(bill.totalAmount);
    const student = bill.student;
    const month = billMonth(bill);

    let row = byStudent.get(student.id);
    if (!row) {
      row = emptyStudentRow(student);
      byStudent.set(student.id, row);
    }

    row.sessionsCount += bill.sessions.filter((s) => s.isAttended).length;

    if (bill.status === "paid") {
      paid += amount;
      row.paid += amount;
    } else {
      unpaid += amount;
      unpaidBillCount += 1;
      row.unpaid += amount;
    }
    row.total += amount;

    if (month) {
      let bucket = byMonth.get(month);
      if (!bucket) {
        bucket = {
          month,
          label: monthLabel(month),
          paid: 0,
          unpaid: 0,
          total: 0,
          billCount: 0,
        };
        byMonth.set(month, bucket);
      }
      bucket.billCount += 1;
      bucket.total += amount;
      if (bill.status === "paid") bucket.paid += amount;
      else bucket.unpaid += amount;
    }

    billRows.push({
      id: bill.id,
      studentId: student.id,
      studentName: student.name,
      subject: student.subject,
      status: bill.status,
      totalAmount: amount,
      month,
      startDate: bill.startDate,
    });
  }

  billRows.sort((a, b) => {
    // Newest months first; null month last. Within a month, higher id first.
    if (a.month === b.month) return b.id - a.id;
    if (!a.month) return 1;
    if (!b.month) return -1;
    return b.month.localeCompare(a.month);
  });

  const months = [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));

  return {
    paid,
    unpaid,
    total: paid + unpaid,
    totalBillCount,
    unpaidBillCount,
    students: [...byStudent.values()],
    bills: billRows,
    byMonth: months,
  };
}
