import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody, jsonError, findOwnedStudent } from "@/lib/auth-helpers";
import { StudentSchedule } from "@/lib/db/index";
import { scheduleSchema, scheduleUpdateSchema, scheduleDeleteSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await findOwnedStudent(user.id, id);
  if (!student) return jsonError(404, "Không tìm thấy học sinh");

  const schedules = await StudentSchedule.findAll({ where: { studentId: student.id } });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await findOwnedStudent(user.id, id);
  if (!student) return jsonError(404, "Không tìm thấy học sinh");

  const { value, response: badBody } = await parseBody(req, scheduleSchema);
  if (badBody) return badBody;

  const schedule = await StudentSchedule.create({ ...value, studentId: student.id });
  return NextResponse.json(schedule, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await findOwnedStudent(user.id, id);
  if (!student) return jsonError(404, "Không tìm thấy học sinh");

  const { value, response: badBody } = await parseBody(req, scheduleUpdateSchema);
  if (badBody) return badBody;

  const schedule = await StudentSchedule.findOne({
    where: { id: value.scheduleId, studentId: student.id },
  });
  if (!schedule) return jsonError(404, "Không tìm thấy lịch học");

  await schedule.update({ startTime: value.startTime, endTime: value.endTime });
  return NextResponse.json(schedule);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await findOwnedStudent(user.id, id);
  if (!student) return jsonError(404, "Không tìm thấy học sinh");

  const { value, response: badBody } = await parseBody(req, scheduleDeleteSchema);
  if (badBody) return badBody;

  await StudentSchedule.destroy({ where: { id: value.scheduleId, studentId: student.id } });
  return NextResponse.json({ ok: true });
}
