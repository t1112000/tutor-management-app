import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession, Student } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({
    where: { id: Number(id), createdBy: user!.id },
    include: [
      { model: Student, as: "student" },
      { model: BillSession, as: "sessions", order: [["scheduledDate", "ASC"], ["startTime", "ASC"]] as any },
    ],
  });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(bill);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id), createdBy: user!.id } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (bill.status === "paid") return NextResponse.json({ error: "Paid bills cannot be modified" }, { status: 400 });

  const { totalAmount, notes } = await req.json();
  await bill.update({ totalAmount, notes });
  return NextResponse.json(bill);
}
