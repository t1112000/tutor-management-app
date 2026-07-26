import { NextRequest, NextResponse } from "next/server";
import { requireUser, parseBody, jsonError, findOwnedBill } from "@/lib/auth-helpers";
import { BillSession, Student } from "@/lib/db/index";
import { billUpdateSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await findOwnedBill(user.id, id, {
    include: [
      { model: Student, as: "student" },
      { model: BillSession, as: "sessions" },
    ],
    order: [[{ model: BillSession, as: "sessions" }, "scheduledDate", "ASC"], [{ model: BillSession, as: "sessions" }, "startTime", "ASC"]],
  });
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");
  return NextResponse.json(bill);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await findOwnedBill(user.id, id);
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");
  if (bill.status === "paid") return jsonError(400, "Hóa đơn đã thanh toán không thể sửa");

  const { value, response: badBody } = await parseBody(req, billUpdateSchema);
  if (badBody) return badBody;

  await bill.update(value);
  return NextResponse.json(bill);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await findOwnedBill(user.id, id);
  if (!bill) return jsonError(404, "Không tìm thấy hóa đơn");

  await bill.update({ deletedAt: new Date() });
  return NextResponse.json({ ok: true });
}
