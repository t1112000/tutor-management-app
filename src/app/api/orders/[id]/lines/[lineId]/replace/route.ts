import { NextRequest, NextResponse } from "next/server";
import {
  requireAccountType,
  parseBody,
  jsonError,
  findOwnedOrder,
  findOwnedAccount,
} from "@/lib/auth-helpers";
import { OrderLine, OrderLineAssignment, sequelize } from "@/lib/db/index";
import { orderReplaceSchema } from "@/lib/validations";
import { isReplaceAllowed } from "@/lib/orderWarranty";
import { todayVN } from "@/lib/time";
import { accountHasLiveAssignment } from "@/lib/orderAssignments";
import { loadOrderForUser } from "@/lib/orderResponse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class OrderReplaceError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id, lineId } = await params;
  const { value, response: badBody } = await parseBody(req, orderReplaceSchema);
  if (badBody) return badBody;

  const order = await findOwnedOrder(user.id, id);
  if (!order) return jsonError(404, "Không tìm thấy đơn hàng");

  const line = await OrderLine.findOne({ where: { id: Number(lineId), orderId: order.id } });
  if (!line) return jsonError(404, "Không tìm thấy đơn hàng");

  if (
    !isReplaceAllowed({
      type: line.warrantyType,
      warrantyUntil: line.warrantyUntil,
      today: todayVN(),
    })
  ) {
    return jsonError(400, "Dòng này không còn bảo hành");
  }

  try {
    await sequelize.transaction(async (t) => {
      const current = await OrderLineAssignment.findOne({
        where: { orderLineId: line.id, replacedAt: null },
        transaction: t,
      });
      if (current && current.accountId === value.accountId) {
        throw new OrderReplaceError(400, "Tài khoản trùng với tài khoản hiện tại");
      }

      const account = await findOwnedAccount(user.id, value.accountId, { transaction: t });
      if (!account) throw new OrderReplaceError(400, "Không tìm thấy tài khoản");
      if (account.status !== "available") {
        throw new OrderReplaceError(400, "Tài khoản không còn hàng");
      }
      if (await accountHasLiveAssignment(account.id, t)) {
        throw new OrderReplaceError(400, "Tài khoản đang gắn vào đơn khác");
      }

      const now = new Date();
      if (current) {
        current.replacedAt = now;
        await current.save({ transaction: t });
      }
      await OrderLineAssignment.create(
        {
          orderLineId: line.id,
          accountId: account.id,
          assignedAt: now,
          replacedAt: null,
        },
        { transaction: t }
      );
      account.status = "sold";
      await account.save({ transaction: t });
    });
  } catch (e) {
    if (e instanceof OrderReplaceError) return jsonError(e.status, e.message);
    throw e;
  }

  const detail = await loadOrderForUser(user.id, order.id, { withSecrets: true });
  return NextResponse.json(detail);
}
