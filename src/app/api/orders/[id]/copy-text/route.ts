import { NextRequest, NextResponse } from "next/server";
import { requireAccountType, parseBody, jsonError, findOwnedOrder } from "@/lib/auth-helpers";
import { Account, OrderLine, OrderLineAssignment } from "@/lib/db/index";
import { orderCopyTextSchema } from "@/lib/validations";
import { toAccountResponse } from "@/lib/accountResponse";
import { buildAccountCopyText } from "@/lib/accountCopyText";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAccountType("reseller");
  if (response) return response;

  const { id } = await params;
  const { value, response: badBody } = await parseBody(req, orderCopyTextSchema);
  if (badBody) return badBody;

  const order = await findOwnedOrder(user.id, id, {
    include: [
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
    order: [[{ model: OrderLine, as: "lines" }, "id", "ASC"]],
  });
  if (!order) return jsonError(404, "Không tìm thấy đơn hàng");

  const currentAccounts: Account[] = [];
  for (const line of order.lines ?? []) {
    const current = (line.assignments ?? []).find((a) => a.replacedAt == null);
    if (current?.account) currentAccounts.push(current.account);
  }

  let selected = currentAccounts;
  if (value.ids !== undefined) {
    const currentIds = new Set(currentAccounts.map((a) => a.id));
    if (value.ids.some((accountId) => !currentIds.has(accountId))) {
      return jsonError(400, "Tài khoản không thuộc đơn này");
    }
    const byId = new Map(currentAccounts.map((a) => [a.id, a]));
    selected = value.ids.map((accountId) => byId.get(accountId)!);
  }

  return NextResponse.json({ text: buildAccountCopyText(selected.map(toAccountResponse)) });
}
