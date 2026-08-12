import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError } from "@/lib/auth-helpers";
import { Bill, BillSession, Student } from "@/lib/db/index";
import { Op } from "sequelize";
import { todayVN } from "@/lib/time";
import {
  computeAllTimeReport,
  computeMonthlyReport,
  type ReportBillInput,
} from "@/lib/report";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInput(bills: Bill[]): ReportBillInput[] {
  return bills.map((b) => ({
    id: b.id,
    status: b.status,
    totalAmount: b.totalAmount,
    startDate: b.startDate,
    student: b.student
      ? { id: b.student.id, name: b.student.name, subject: b.student.subject }
      : null,
    sessions: (b.sessions ?? []).map((s) => ({
      scheduledDate: s.scheduledDate,
      isAttended: s.isAttended,
    })),
  }));
}

const billInclude = [
  {
    model: Student,
    as: "student" as const,
    where: { deletedAt: null },
    required: true,
    attributes: ["id", "name", "subject"],
  },
  // All sessions: month attribution uses earliest session when startDate is null.
  { model: BillSession, as: "sessions" as const, attributes: ["scheduledDate", "isAttended"] },
];

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const scope = req.nextUrl.searchParams.get("scope");
  if (scope !== null && scope !== "all") {
    return jsonError(400, "Phạm vi không hợp lệ");
  }

  if (scope === "all") {
    const bills = await Bill.findAll({
      where: { deletedAt: null, createdBy: user.id },
      attributes: ["id", "status", "totalAmount", "startDate"],
      include: billInclude,
      order: [["id", "DESC"]],
    });
    return NextResponse.json(computeAllTimeReport(toInput(bills)));
  }

  const monthParam = req.nextUrl.searchParams.get("month") ?? todayVN().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(monthParam)) return jsonError(400, "Tháng không hợp lệ");

  const [year, month] = monthParam.split("-").map(Number);
  if (month < 1 || month > 12) return jsonError(400, "Tháng không hợp lệ");
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  // Candidate invoices: any that have a session in the month. Ownership is
  // enforced by the second query, so only ids leave this one.
  const sessionsInMonth = await BillSession.findAll({
    attributes: ["billId"],
    where: { scheduledDate: { [Op.between]: [monthStart, monthEnd] } },
  });
  const candidateIds = [...new Set(sessionsInMonth.map((s) => s.billId))];

  const bills = await Bill.findAll({
    where: {
      deletedAt: null,
      createdBy: user.id,
      [Op.or]: [{ id: candidateIds }, { startDate: { [Op.between]: [monthStart, monthEnd] } }],
    },
    attributes: ["id", "status", "totalAmount", "startDate"],
    include: billInclude,
  });

  return NextResponse.json(computeMonthlyReport(toInput(bills), monthParam));
}
