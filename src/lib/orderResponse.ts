import { findOwnedOrder } from "@/lib/auth-helpers";
import {
  Account,
  Customer,
  CustomerContact,
  Order,
  OrderLine,
  OrderLineAssignment,
} from "@/lib/db/index";
import { toAccountListResponse, toAccountResponse } from "@/lib/accountResponse";
import { isReplaceAllowed } from "@/lib/orderWarranty";
import { todayVN } from "@/lib/time";

function currentAssignment(line: OrderLine): OrderLineAssignment | undefined {
  return (line.assignments ?? []).find((a) => a.replacedAt == null);
}

function linePrice(line: OrderLine): number {
  return Number(line.price);
}

function totalPrice(order: Order): number {
  return (order.lines ?? []).reduce((sum, line) => sum + linePrice(line), 0);
}

export function toOrderListItem(order: Order) {
  const customer = order.customer;
  return {
    id: order.id,
    createdAt: order.createdAt,
    notes: order.notes,
    totalPrice: totalPrice(order),
    customer: {
      id: customer!.id,
      name: customer!.name,
    },
    lines: (order.lines ?? []).map((line) => {
      const account = currentAssignment(line)?.account ?? null;
      return {
        id: line.id,
        warrantyType: line.warrantyType,
        warrantyUntil: line.warrantyUntil,
        warrantyDays: line.warrantyDays,
        price: linePrice(line),
        currentAccount: account ? toAccountListResponse(account) : null,
      };
    }),
  };
}

export function toOrderDetail(order: Order) {
  const customer = order.customer;
  const today = todayVN();
  return {
    id: order.id,
    createdAt: order.createdAt,
    notes: order.notes,
    totalPrice: totalPrice(order),
    customer: {
      id: customer!.id,
      name: customer!.name,
      contacts: customer!.contacts ?? [],
    },
    lines: (order.lines ?? []).map((line) => {
      const account = currentAssignment(line)?.account ?? null;
      const assignments = [...(line.assignments ?? [])].sort(
        (a, b) => a.assignedAt.getTime() - b.assignedAt.getTime()
      );
      return {
        id: line.id,
        warrantyType: line.warrantyType,
        warrantyUntil: line.warrantyUntil,
        warrantyDays: line.warrantyDays,
        price: linePrice(line),
        replaceAllowed: isReplaceAllowed({
          type: line.warrantyType,
          warrantyUntil: line.warrantyUntil,
          today,
        }),
        currentAccount: account ? toAccountResponse(account) : null,
        assignments: assignments.map((a) => ({
          id: a.id,
          assignedAt: a.assignedAt,
          replacedAt: a.replacedAt,
          account: toAccountListResponse(a.account!),
        })),
      };
    }),
  };
}

export async function loadOrderForUser(
  userId: number,
  orderId: string | number,
  opts?: { withSecrets: boolean }
) {
  const order = await findOwnedOrder(userId, orderId, {
    include: [
      {
        model: Customer,
        as: "customer",
        include: [{ model: CustomerContact, as: "contacts" }],
      },
      {
        model: OrderLine,
        as: "lines",
        include: [
          {
            model: OrderLineAssignment,
            as: "assignments",
            include: [{ model: Account, as: "account" }],
          },
        ],
      },
    ],
    order: [
      [
        { model: OrderLine, as: "lines" },
        { model: OrderLineAssignment, as: "assignments" },
        "assignedAt",
        "ASC",
      ],
    ],
  });
  if (!order) return null;
  return opts?.withSecrets ? toOrderDetail(order) : toOrderListItem(order);
}
