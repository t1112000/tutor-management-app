import { NextRequest, NextResponse } from "next/server";
import { requireUser, jsonError, findOwnedBill } from "@/lib/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  // findOwnedBill filters deletedAt: a soft-deleted invoice must not be payable.
  const bill = await findOwnedBill(user.id, id);
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");
  if (bill.status === "paid") return jsonError(400, "Hóa đơn đã được thanh toán");

  await bill.update({ status: "paid", paidAt: new Date() });
  return NextResponse.json(bill);
}
