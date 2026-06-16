import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession, Student } from "@/lib/db/index";
import { Op } from "sequelize";
import { weekStartStr, weekEndStr, todayVN } from "@/lib/time";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const weekStartParam = req.nextUrl.searchParams.get("weekStart") ?? weekStartStr(todayVN());

  const sessions = await BillSession.findAll({
    where: {
      scheduledDate: { [Op.between]: [weekStartParam, weekEndStr(weekStartParam)] },
    },
    include: [
      {
        model: Bill,
        as: "bill",
        where: { createdBy: user!.id },
        include: [{ model: Student, as: "student" }],
      },
    ],
    order: [["scheduledDate", "ASC"], ["startTime", "ASC"]],
  });

  return NextResponse.json(sessions);
}
