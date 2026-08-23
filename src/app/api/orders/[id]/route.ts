import { NextRequest, NextResponse } from "next/server";
import { requireAccountType, jsonError, findOwnedOrder } from "@/lib/auth-helpers";
import { Account, OrderLine, OrderLineAssignment, sequelize } from "@/lib/db/index";
import { loadOrderForUser } from "@/lib/orderResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const order = await loadOrderForUser(user.id, id, { withSecrets: true });
  if (!order) return jsonError(404, "Không tìm thấy đơn hàng");

  return NextResponse.json(order);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const order = await findOwnedOrder(user.id, id);
  if (!order) return jsonError(404, "Không tìm thấy đơn hàng");

  await sequelize.transaction(async (t) => {
    const lines = await OrderLine.findAll({
      where: { orderId: order.id },
      transaction: t,
    });
    const lineIds = lines.map((l) => l.id);
    const assignments =
      lineIds.length === 0
        ? []
        : await OrderLineAssignment.findAll({
            where: { orderLineId: lineIds, replacedAt: null },
            include: [{ model: Account, as: "account" }],
            transaction: t,
          });

    const now = new Date();
    for (const assignment of assignments) {
      assignment.replacedAt = now;
      await assignment.save({ transaction: t });
      if (assignment.account) {
        assignment.account.status = "available";
        await assignment.account.save({ transaction: t });
      }
    }

    order.deletedAt = now;
    await order.save({ transaction: t });
  });

  return NextResponse.json({ ok: true });
}
