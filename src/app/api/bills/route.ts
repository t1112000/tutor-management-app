import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody, jsonError, findOwnedStudent } from "@/lib/auth-helpers";
import { sequelize, Bill, BillSession } from "@/lib/db/index";
import { billSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, billSchema);
  if (badBody) return badBody;

  const student = await findOwnedStudent(user.id, value.studentId);
  if (!student) return jsonError(404, "Không tìm thấy học sinh");

  const t = await sequelize.transaction();
  try {
    const bill = await Bill.create(
      {
        studentId: student.id,
        sessionCount: value.sessionCount,
        totalAmount: value.totalAmount,
        startDate: value.startDate ?? null,
        notes: value.notes ?? null,
        createdBy: user.id,
        status: "unpaid",
        paidAt: null,
      },
      { transaction: t }
    );

    if (value.sessions.length > 0) {
      await BillSession.bulkCreate(
        value.sessions.map((s) => ({ ...s, billId: bill.id, isAttended: false, notes: null })),
        { transaction: t }
      );
    }

    await t.commit();
    return NextResponse.json({ id: bill.id }, { status: 201 });
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
