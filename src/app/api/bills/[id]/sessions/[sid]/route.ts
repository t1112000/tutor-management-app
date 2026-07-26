import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody, jsonError, findOwnedBill } from "@/lib/auth-helpers";
import { BillSession, sequelize } from "@/lib/db/index";
import { sessionUpdateSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id, sid } = await params;

  const bill = await findOwnedBill(user.id, id);
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");

  const session = await BillSession.findOne({ where: { id: Number(sid), billId: bill.id } });
  if (!session) return jsonError(404, "Không tìm thấy buổi học");

  const { value, response: badBody } = await parseBody(req, sessionUpdateSchema);
  if (badBody) return badBody;

  // Every other handler refuses to touch a paid invoice. Correcting attendance
  // or notes after payment is legitimate; rewriting the schedule is not.
  if (bill.status === "paid") {
    const reschedules = ["scheduledDate", "startTime", "endTime"] as const;
    if (reschedules.some((k) => value[k] !== undefined)) {
      return jsonError(400, "Hóa đơn đã thanh toán không thể đổi lịch buổi học");
    }
  }

  await session.update(value);
  return NextResponse.json(session);
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string; sid: string }> }
) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id, sid } = await params;

  const bill = await findOwnedBill(user.id, id);
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");
  if (bill.status === "paid") return jsonError(400, "Hóa đơn đã thanh toán không thể sửa");

  const session = await BillSession.findOne({ where: { id: Number(sid), billId: bill.id } });
  if (!session) return jsonError(404, "Không tìm thấy buổi học");

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
