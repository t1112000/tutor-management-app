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
    where: { id: Number(id) },
    include: [
      { model: StudentSchedule, as: "schedules" },
      {
        model: Bill,
        as: "bills",
        where: { deletedAt: null },
        required: false,
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

  const student = await Student.findOne({ where: { id: Number(id) } });
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

  const student = await Student.findOne({ where: { id: Number(id) } });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Destroy all bills (including soft-deleted) and their sessions
  const allBills = await Bill.findAll({ where: { studentId: student.id } });
  for (const bill of allBills) {
    await BillSession.destroy({ where: { billId: bill.id } });
    await bill.destroy();
  }
  await StudentSchedule.destroy({ where: { studentId: student.id } });
  await student.destroy();
  return NextResponse.json({ ok: true });
}
