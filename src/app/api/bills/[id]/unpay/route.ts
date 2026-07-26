import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError, findOwnedBill } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Undo a payment. Marking an invoice paid was irreversible: a mistap locked the
 * invoice for good, and the only recovery was deleting it and losing its
 * attendance history with it.
 */
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await findOwnedBill(user.id, id);
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");
  if (bill.status !== "paid") return jsonError(400, "Hóa đơn chưa được thanh toán");

  await bill.update({ status: "unpaid", paidAt: null });
  return NextResponse.json(bill);
}
