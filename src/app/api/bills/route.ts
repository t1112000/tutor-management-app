import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { sequelize, Bill, BillSession, Student } from "@/lib/db/index";
import { billSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await req.json();
  const parsed = billSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  // Verify student belongs to user
  const student = await Student.findOne({ where: { id: parsed.data.studentId, createdBy: user!.id } });
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

  const t = await sequelize.transaction();
  try {
    const bill = await Bill.create(
      {
        studentId: parsed.data.studentId,
        sessionCount: parsed.data.sessionCount,
        totalAmount: parsed.data.totalAmount,
        startDate: parsed.data.startDate ?? null,
        notes: parsed.data.notes ?? null,
        createdBy: user!.id,
        status: "unpaid",
        paidAt: null,
      },
      { transaction: t }
    );

    if (parsed.data.sessions.length > 0) {
      await BillSession.bulkCreate(
        parsed.data.sessions.map((s) => ({ ...s, billId: bill.id, isAttended: false, notes: null })),
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
