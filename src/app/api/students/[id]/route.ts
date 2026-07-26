import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody, jsonError, findOwnedStudent } from "@/lib/auth-helpers";
import { StudentSchedule, Bill, BillSession } from "@/lib/db/index";
import { studentSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await findOwnedStudent(user.id, id, {
    include: [
      { model: StudentSchedule, as: "schedules" },
      {
        model: Bill,
        as: "bills",
        where: { deletedAt: null },
        required: false,
        include: [{ model: BillSession, as: "sessions" }],
      },
    ],
    // `order` inside an include is silently ignored by Sequelize unless the
    // include is `separate: true`, so it has to be declared at the top level.
    order: [[{ model: Bill, as: "bills" }, "createdAt", "DESC"]],
  });
  if (!student) return jsonError(404, "Không tìm thấy học sinh");
  return NextResponse.json(student);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await findOwnedStudent(user.id, id);
  if (!student) return jsonError(404, "Không tìm thấy học sinh");

  const { value, response: badBody } = await parseBody(req, studentSchema);
  if (badBody) return badBody;

  await student.update(value);
  return NextResponse.json(student);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const student = await findOwnedStudent(user.id, id);
  if (!student) return jsonError(404, "Không tìm thấy học sinh");

  // Soft delete. This used to hard-destroy every invoice (including already
  // soft-deleted ones) and every session in a loop with no transaction, which
  // permanently erased paid financial records with no way back.
  await student.update({ deletedAt: new Date() });
  return NextResponse.json({ ok: true });
}
