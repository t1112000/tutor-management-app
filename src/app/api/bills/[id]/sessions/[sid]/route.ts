import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession, sequelize } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id, sid } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await BillSession.findOne({ where: { id: Number(sid), billId: Number(id) } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};
  if (typeof body.isAttended === "boolean") updates.isAttended = body.isAttended;
  if (body.scheduledDate) updates.scheduledDate = body.scheduledDate;
  if (body.startTime) updates.startTime = body.startTime;
  if (body.endTime) updates.endTime = body.endTime;
  if (body.notes !== undefined) updates.notes = body.notes;

  await session.update(updates);
  return NextResponse.json(session);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id, sid } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), deletedAt: null } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ error: "Paid bills cannot be modified" }, { status: 400 });

  const session = await BillSession.findOne({ where: { id: Number(sid), billId: Number(id) } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const t = await sequelize.transaction();
  try {
    await session.destroy({ transaction: t });
    await bill.update({ sessionCount: Math.max(0, bill.sessionCount - 1) }, { transaction: t });
    await t.commit();
    return NextResponse.json({ ok: true });
  } catch (err) {
    await t.rollback();
    throw err;
  }
}
