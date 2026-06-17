import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Student, StudentSchedule, Bill, BillSession } from "@/lib/db/index";
import { studentSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await Student.findOne({
    where: { id: Number(id), createdBy: user!.id },
    include: [
      { model: StudentSchedule, as: "schedules" },
      {
        model: Bill,
        as: "bills",
        include: [{ model: BillSession, as: "sessions" }],
        order: [["createdAt", "DESC"]] as any,
      },
    ],
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(student);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await Student.findOne({ where: { id: Number(id), createdBy: user!.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await student.update(parsed.data);
  return NextResponse.json(student);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await Student.findOne({ where: { id: Number(id), createdBy: user!.id } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await student.destroy();
  return NextResponse.json({ ok: true });
}
