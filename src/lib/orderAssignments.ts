import type { Transaction } from "sequelize";
import { Order, OrderLine, OrderLineAssignment } from "@/lib/db/index";

export async function accountHasLiveAssignment(
  accountId: number,
  transaction?: Transaction
): Promise<boolean> {
  const row = await OrderLineAssignment.findOne({
    where: { accountId, replacedAt: null },
    include: [{
      model: OrderLine,
      as: "line",
      required: true,
      include: [{ model: Order, as: "order", required: true, where: { deletedAt: null } }],
    }],
    transaction,
  });
  return row != null;
}
