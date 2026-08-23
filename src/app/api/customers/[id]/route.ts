import { NextRequest, NextResponse } from "next/server";
import { requireAccountType, parseBody, findOwnedCustomer, jsonError } from "@/lib/auth-helpers";
import { type Customer, CustomerContact, Order, OrderLine, sequelize } from "@/lib/db/index";
import { customerUpdateSchema } from "@/lib/validations";
import type { Includeable } from "sequelize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const detailInclude: Includeable[] = [
  { model: CustomerContact, as: "contacts" },
  {
    model: Order,
    as: "orders",
    where: { deletedAt: null },
    required: false,
    include: [{ model: OrderLine, as: "lines", attributes: ["id", "price"] }],
  },
];

function toCustomerDetail(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    notes: customer.notes,
    createdAt: customer.createdAt,
    contacts: customer.contacts ?? [],
    orders: (customer.orders ?? []).map((o) => ({
      id: o.id,
      createdAt: o.createdAt,
      lineCount: o.lines?.length ?? 0,
      totalPrice: (o.lines ?? []).reduce((s, l) => s + Number(l.price), 0),
    })),
  };
}

async function loadOwnedCustomerDetail(userId: number, id: string | number) {
  return findOwnedCustomer(userId, id, { include: detailInclude });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const customer = await loadOwnedCustomerDetail(user.id, id);
  if (!customer) return jsonError(404, "Không tìm thấy khách hàng");

  return NextResponse.json(toCustomerDetail(customer));
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const customer = await findOwnedCustomer(user.id, id);
  if (!customer) return jsonError(404, "Không tìm thấy khách hàng");

  const { value, response: badBody } = await parseBody(req, customerUpdateSchema);
  if (badBody) return badBody;

  if (value.name !== undefined) customer.name = value.name;
  if (value.notes !== undefined) customer.notes = value.notes;

  if (value.contacts !== undefined) {
    const contacts = value.contacts;
    await sequelize.transaction(async (t) => {
      await customer.save({ transaction: t });
      await CustomerContact.destroy({ where: { customerId: customer.id }, transaction: t });
      await CustomerContact.bulkCreate(
        contacts.map((c) => ({
          customerId: customer.id,
          type: c.type,
          value: c.value,
        })),
        { transaction: t }
      );
    });
  } else {
    await customer.save();
  }

  const reloaded = await loadOwnedCustomerDetail(user.id, customer.id);
  if (!reloaded) return jsonError(404, "Không tìm thấy khách hàng");
  return NextResponse.json(toCustomerDetail(reloaded));
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const customer = await findOwnedCustomer(user.id, id);
  if (!customer) return jsonError(404, "Không tìm thấy khách hàng");

  const liveOrders = await Order.count({
    where: { customerId: customer.id, createdBy: user.id, deletedAt: null },
  });
  if (liveOrders > 0) return jsonError(409, "Không xóa được — khách còn đơn");

  customer.deletedAt = new Date();
  await customer.save();
  return NextResponse.json({ ok: true });
}
