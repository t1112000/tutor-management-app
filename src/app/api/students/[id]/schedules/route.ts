import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Student, StudentSchedule } from "@/lib/db/index";
import { scheduleSchema } from "@/lib/validations";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await Student.findOne({ where: { id: Number(id), createdBy: user!.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const schedules = await StudentSchedule.findAll({ where: { studentId: Number(id) } });
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await Student.findOne({ where: { id: Number(id), createdBy: user!.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const schedule = await StudentSchedule.create({ ...parsed.data, studentId: Number(id) });
  return NextResponse.json(schedule, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await Student.findOne({ where: { id: Number(id), createdBy: user!.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { scheduleId } = await req.json();
  await StudentSchedule.destroy({ where: { id: scheduleId, studentId: Number(id) } });
  return NextResponse.json({ ok: true });
}
