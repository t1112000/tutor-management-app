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
      row = {
        studentId: student.id,
        name: student.name,
        subject: student.subject,
        paid: 0,
        unpaid: 0,
        total: 0,
        sessionsCount: 0,
      };
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
