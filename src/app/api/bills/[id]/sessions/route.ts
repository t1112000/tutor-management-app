import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody, jsonError, findOwnedBill } from "@/lib/auth-helpers";
import { BillSession, sequelize } from "@/lib/db/index";
import { sessionCreateSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await findOwnedBill(user.id, id);
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");

  const sessions = await BillSession.findAll({
    where: { billId: bill.id },
    order: [["scheduledDate", "ASC"], ["startTime", "ASC"]],
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await findOwnedBill(user.id, id);
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");
  if (bill.status === "paid") return jsonError(400, "Hóa đơn đã thanh toán không thể sửa");

  const { value, response: badBody } = await parseBody(req, sessionCreateSchema);
  if (badBody) return badBody;

  const t = await sequelize.transaction();
  try {
    const session = await BillSession.create(
      { billId: bill.id, ...value, isAttended: false, notes: null },
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
