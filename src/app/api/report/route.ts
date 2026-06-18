import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession, Student } from "@/lib/db/index";
import { Op } from "sequelize";
import { todayVN } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const today = todayVN();
  const monthParam = req.nextUrl.searchParams.get("month") ?? today.slice(0, 7);
  const [year, month] = monthParam.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const monthEnd = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

  const bills = await Bill.findAll({
    where: {},
    include: [
      { model: Student, as: "student" },
      {
        model: BillSession,
        as: "sessions",
        where: { scheduledDate: { [Op.between]: [monthStart, monthEnd] } },
        required: false,
      },
    ],
  });

  let paid = 0;
  let unpaid = 0;
  let unpaidBillCount = 0;
  const byStudent: Record<number, { studentId: number; name: string; subject: string; paid: number; unpaid: number; total: number; sessionsCount: number }> = {};

  for (const bill of bills) {
    const s = bill.student as any;
    if (!s) continue;
    if (!byStudent[s.id]) {
      byStudent[s.id] = { studentId: s.id, name: s.name, subject: s.subject, paid: 0, unpaid: 0, total: 0, sessionsCount: 0 };
    }
    const sessions = (bill as any).sessions ?? [];
    byStudent[s.id].sessionsCount += sessions.filter((ss: any) => ss.isAttended).length;

    if (bill.status === "paid") {
      paid += Number(bill.totalAmount);
      byStudent[s.id].paid += Number(bill.totalAmount);
    } else {
      unpaid += Number(bill.totalAmount);
      unpaidBillCount += 1;
      byStudent[s.id].unpaid += Number(bill.totalAmount);
    }
    byStudent[s.id].total += Number(bill.totalAmount);
  }

  return NextResponse.json({
    month: monthParam,
    paid,
    unpaid,
    unpaidBillCount,
    total: paid + unpaid,
    students: Object.values(byStudent),
  });
}
