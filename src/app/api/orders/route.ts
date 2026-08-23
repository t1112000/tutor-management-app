import { NextRequest, NextResponse } from "next/server";
import {
  requireAccountType,
  parseBody,
  jsonError,
  findOwnedCustomer,
  findOwnedAccount,
} from "@/lib/auth-helpers";
import {
  Account,
  Customer,
  CustomerContact,
  Order,
  OrderLine,
  OrderLineAssignment,
  sequelize,
} from "@/lib/db/index";
import { orderCreateSchema } from "@/lib/validations";
import { computeWarrantyUntil } from "@/lib/orderWarranty";
import { todayVN } from "@/lib/time";
import { accountHasLiveAssignment } from "@/lib/orderAssignments";
import { loadOrderForUser, toOrderListItem } from "@/lib/orderResponse";
import type { WhereOptions } from "sequelize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class OrderCreateError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function GET(req: NextRequest) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const rawCustomerId = req.nextUrl.searchParams.get("customerId");
  const parsedCustomerId = rawCustomerId != null ? Number(rawCustomerId) : NaN;
  const customerId =
    Number.isInteger(parsedCustomerId) && parsedCustomerId > 0 ? parsedCustomerId : null;

  const where: WhereOptions = {
    createdBy: user.id,
    deletedAt: null,
    ...(customerId != null ? { customerId } : {}),
  };

  const orders = await Order.findAll({
    where,
    include: [
      { model: Customer, as: "customer", attributes: ["id", "name"] },
      {
        model: OrderLine,
        as: "lines",
        include: [
          {
            model: OrderLineAssignment,
            as: "assignments",
            where: { replacedAt: null },
            required: false,
            include: [{ model: Account, as: "account" }],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return NextResponse.json(orders.map(toOrderListItem));
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, orderCreateSchema);
  if (badBody) return badBody;

  try {
    const createdId = await sequelize.transaction(async (t) => {
      let customerId: number;
      if (value.customerId) {
        const customer = await findOwnedCustomer(user.id, value.customerId, { transaction: t });
        if (!customer) throw new OrderCreateError(404, "Không tìm thấy khách hàng");
        customerId = customer.id;
      } else if (value.customer) {
        const created = await Customer.create(
          {
            name: value.customer.name,
            notes: value.customer.notes ?? null,
            createdBy: user.id,
          },
          { transaction: t }
        );
        if (value.customer.contacts?.length) {
          await CustomerContact.bulkCreate(
            value.customer.contacts.map((c) => ({
              customerId: created.id,
              type: c.type,
              value: c.value,
            })),
            { transaction: t }
          );
        }
        customerId = created.id;
      } else {
        throw new OrderCreateError(400, "Chọn khách hoặc tạo khách mới");
      }

      const accounts: Account[] = [];
      for (const line of value.lines) {
        const account = await findOwnedAccount(user.id, line.accountId, { transaction: t });
        if (!account) throw new OrderCreateError(400, "Không tìm thấy tài khoản");
        if (account.status !== "available") {
          throw new OrderCreateError(400, "Tài khoản không còn hàng");
        }
        if (await accountHasLiveAssignment(account.id, t)) {
          throw new OrderCreateError(400, "Tài khoản đang gắn vào đơn khác");
        }
        accounts.push(account);
      }

      const order = await Order.create(
        {
          customerId,
          notes: value.notes ?? null,
          createdBy: user.id,
        },
        { transaction: t }
      );

      const orderDate = todayVN();
      for (let i = 0; i < value.lines.length; i++) {
        const line = value.lines[i];
        const account = accounts[i];
        const warrantyUntil = computeWarrantyUntil({
          type: line.warrantyType,
          days: line.warrantyDays ?? null,
          accountExpiryDate: account.expiryDate,
          orderDate,
        });
        const orderLine = await OrderLine.create(
          {
            orderId: order.id,
            warrantyType: line.warrantyType,
            warrantyUntil,
            warrantyDays: line.warrantyType === "days" ? line.warrantyDays! : null,
            price: line.price,
          },
          { transaction: t }
        );
        await OrderLineAssignment.create(
          {
            orderLineId: orderLine.id,
            accountId: account.id,
            assignedAt: new Date(),
            replacedAt: null,
          },
          { transaction: t }
        );
        account.status = "sold";
        await account.save({ transaction: t });
      }

      return order.id;
    });

    const detail = await loadOrderForUser(user.id, createdId, { withSecrets: true });
    return NextResponse.json(detail, { status: 201 });
  } catch (e) {
    if (e instanceof OrderCreateError) return jsonError(e.status, e.message);
    throw e;
  }
}
