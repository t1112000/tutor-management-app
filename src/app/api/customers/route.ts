import { NextRequest, NextResponse } from "next/server";
import { requireAccountType, parseBody } from "@/lib/auth-helpers";
import { Customer, CustomerContact, sequelize } from "@/lib/db/index";
import { customerSchema } from "@/lib/validations";
import { Op, type WhereOptions } from "sequelize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const where: WhereOptions = {
    createdBy: user.id,
    deletedAt: null,
    ...(q ? { name: { [Op.iLike]: `%${q}%` } } : {}),
  };

  const customers = await Customer.findAll({
    where,
    include: [{ model: CustomerContact, as: "contacts" }],
    order: [["name", "ASC"]],
  });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { value, response: badBody } = await parseBody(req, customerSchema);
  if (badBody) return badBody;

  const customer = await sequelize.transaction(async (t) => {
    const created = await Customer.create(
      {
        name: value.name,
        notes: value.notes ?? null,
        createdBy: user.id,
      },
      { transaction: t }
    );

    if (value.contacts?.length) {
      await CustomerContact.bulkCreate(
        value.contacts.map((c) => ({
          customerId: created.id,
          type: c.type,
          value: c.value,
        })),
        { transaction: t }
      );
    }

    await created.reload({
      include: [{ model: CustomerContact, as: "contacts" }],
      transaction: t,
    });
    return created;
  });

  return NextResponse.json(customer, { status: 201 });
}
