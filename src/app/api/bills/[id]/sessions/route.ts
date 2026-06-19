import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession, sequelize } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sessions = await BillSession.findAll({
    where: { billId: Number(id) },
    order: [["scheduledDate", "ASC"], ["startTime", "ASC"]],
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ error: "Paid bills cannot be modified" }, { status: 400 });

  const { scheduledDate, startTime, endTime } = await req.json();
  if (!scheduledDate || !startTime || !endTime) {
    return NextResponse.json({ error: "scheduledDate, startTime, endTime required" }, { status: 400 });
  }

  const t = await sequelize.transaction();
  try {
    const session = await BillSession.create(
      { billId: Number(id), scheduledDate, startTime, endTime, isAttended: false, notes: null },
      { transaction: t }
    );
    await bill.update({ sessionCount: bill.sessionCount + 1 }, { transaction: t });
    await t.commit();
    return NextResponse.json(session, { status: 201 });
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
