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
        where: { deletedAt: null, createdBy: user.id },
        required: true,
        attributes: ["id", "status", "notes"],
        include: [
          {
            model: Student,
            as: "student",
            where: { deletedAt: null },
            required: true,
            attributes: ["id", "name", "subject", "color", "type", "address"],
          },
        ],
      },
    ],
    order: [["scheduledDate", "ASC"], ["startTime", "ASC"]],
  });

  // Explicit DTO: this endpoint is polled every 60s, and the raw models carry
  // parent phone numbers and invoice totals the calendar never displays.
  const slots = sessions.map((s) => ({
    id: s.id,
    scheduledDate: s.scheduledDate,
    startTime: s.startTime,
    endTime: s.endTime,
    isAttended: s.isAttended,
    notes: s.notes,
    bill: {
      id: s.bill!.id,
      status: s.bill!.status,
      notes: s.bill!.notes,
      student: {
        id: s.bill!.student!.id,
        name: s.bill!.student!.name,
        subject: s.bill!.student!.subject,
        color: s.bill!.student!.color,
        type: s.bill!.student!.type,
        address: s.bill!.student!.address,
      },
    },
  }));

  return NextResponse.json(slots, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
