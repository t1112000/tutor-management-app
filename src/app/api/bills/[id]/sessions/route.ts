import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-helpers";
import { Bill, BillSession } from "@/lib/db/index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;
  const { id } = await params;

  const bill = await Bill.findOne({ where: { id: Number(id) } });
  if (!bill) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sessions = await BillSession.findAll({
    where: { billId: Number(id) },
    order: [["scheduledDate", "ASC"], ["startTime", "ASC"]],
  });
  return NextResponse.json(sessions);
}
