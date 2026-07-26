import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Student, StudentSchedule } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const schedules = await StudentSchedule.findAll({
    include: [
      {
        model: Student,
        as: "student",
        where: { createdBy: user.id, deletedAt: null },
        required: true,
      },
    ],
  });

  const slots = schedules
    .map((schedule) => ({
      id: schedule.id,
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      student: {
        id: schedule.student!.id,
        name: schedule.student!.name,
        subject: schedule.student!.subject,
        color: schedule.student!.color,
        type: schedule.student!.type,
        address: schedule.student!.address,
      },
    }))
    .sort((a, b) => {
      const normalizedDayA = a.dayOfWeek === 0 ? 7 : a.dayOfWeek;
      const normalizedDayB = b.dayOfWeek === 0 ? 7 : b.dayOfWeek;
      return normalizedDayA - normalizedDayB || a.startTime.localeCompare(b.startTime);
    });

  return NextResponse.json(slots, {
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}
