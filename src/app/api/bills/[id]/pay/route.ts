import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), createdBy: user!.id } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ error: "Already paid" }, { status: 400 });

  await bill.update({ status: "paid", paidAt: new Date() });
  return NextResponse.json(bill);
}
